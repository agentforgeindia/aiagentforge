-- ============================================================
-- AgentForge — Refund flow (Phase 1.4)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Adds refund tracking columns to public.payments + a single
-- atomic process_refund() RPC that:
--   1. Marks the payment as refunded (full or partial).
--   2. Optionally deducts the matching credits from the user's
--      wallet (best-effort — caps at current balance).
--   3. Writes an entry to admin_audit.
--
-- Razorpay's refund API is called from the Next.js server route
-- (lib has no HTTP client). The RPC just records the result.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  Columns
-- ────────────────────────────────────────────────────────────
alter table public.payments
  add column if not exists refund_amount      numeric(12,2),
  add column if not exists refund_reason      text,
  add column if not exists refunded_at        timestamptz,
  add column if not exists refunded_by        uuid references auth.users(id) on delete set null,
  add column if not exists razorpay_refund_id text;

create index if not exists payments_refunded_idx
  on public.payments (refunded_at)
  where refunded_at is not null;

-- ────────────────────────────────────────────────────────────
-- 2.  process_refund — atomic update + credit deduction + audit
-- ────────────────────────────────────────────────────────────

create or replace function public.process_refund(
  p_payment_id           uuid,
  p_refund_amount        numeric,
  p_reason               text,
  p_deduct_credits       boolean default false,
  p_credit_amount        bigint  default null,
  p_razorpay_refund_id   text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment    record;
  v_actor      uuid := auth.uid();
  v_actor_email text;
  v_credits_to_pull bigint;
  v_new_balance bigint;
  v_status     text;
begin
  -- Permission gate (bypass for direct postgres/service-role calls).
  if not (
    current_user in ('service_role', 'postgres')
    or public.has_permission('invoices.refund')
    or public.has_permission('*')
  ) then
    raise exception 'process_refund: caller lacks invoices.refund permission';
  end if;

  if p_payment_id is null then
    raise exception 'process_refund: payment_id is required';
  end if;
  if p_refund_amount is null or p_refund_amount <= 0 then
    raise exception 'process_refund: refund_amount must be positive';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'process_refund: a reason is required';
  end if;

  -- Lock the payment row.
  select * into v_payment
    from public.payments
   where id = p_payment_id
   for update;

  if v_payment.id is null then
    raise exception 'process_refund: payment % not found', p_payment_id;
  end if;
  if v_payment.status = 'refunded' then
    raise exception 'process_refund: payment already refunded';
  end if;
  if p_refund_amount > coalesce(v_payment.amount, 0) then
    raise exception
      'process_refund: refund amount % exceeds original payment %',
      p_refund_amount, v_payment.amount;
  end if;

  v_status :=
    case when p_refund_amount = v_payment.amount then 'refunded'
         else 'partially_refunded' end;

  -- 1. Update payment row.
  update public.payments
     set status              = v_status,
         refund_amount       = p_refund_amount,
         refund_reason       = p_reason,
         refunded_at         = now(),
         refunded_by         = v_actor,
         razorpay_refund_id  = p_razorpay_refund_id
   where id = p_payment_id;

  -- 2. Optionally deduct credits. Caps at current balance.
  if p_deduct_credits then
    v_credits_to_pull := coalesce(p_credit_amount, v_payment.credits_added);

    select credits into v_new_balance
      from public.profiles
     where id = v_payment.user_id
     for update;

    if v_new_balance is null then
      v_new_balance := 0;
    end if;

    if v_credits_to_pull > v_new_balance then
      v_credits_to_pull := v_new_balance;
    end if;

    if v_credits_to_pull > 0 then
      update public.profiles
         set credits    = credits - v_credits_to_pull,
             updated_at = now()
       where id = v_payment.user_id
       returning credits into v_new_balance;

      insert into public.credit_transactions(
        user_id, delta, reason, generation_id, balance_after
      ) values (
        v_payment.user_id,
        -v_credits_to_pull,
        'refund:' || coalesce(v_payment.plan, 'plan'),
        v_payment.razorpay_payment_id,
        v_new_balance
      );
    end if;
  end if;

  -- 3. Audit.
  select email into v_actor_email from auth.users where id = v_actor;

  insert into public.admin_audit(
    actor_user_id, actor_email, action, target_type, target_id, details
  ) values (
    v_actor, v_actor_email,
    'invoices.refund', 'payment', p_payment_id::text,
    jsonb_build_object(
      'amount',           p_refund_amount,
      'reason',           p_reason,
      'deducted_credits', coalesce(v_credits_to_pull, 0),
      'razorpay_refund_id', p_razorpay_refund_id,
      'user_id',          v_payment.user_id,
      'plan',             v_payment.plan
    )
  );

  return jsonb_build_object(
    'success',          true,
    'payment_id',       p_payment_id,
    'new_status',       v_status,
    'refund_amount',    p_refund_amount,
    'deducted_credits', coalesce(v_credits_to_pull, 0),
    'new_balance',      v_new_balance
  );
end;
$$;

revoke all on function public.process_refund(uuid, numeric, text, boolean, bigint, text) from public;
grant execute on function public.process_refund(uuid, numeric, text, boolean, bigint, text) to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- Verification:
--   select column_name from information_schema.columns
--     where table_schema='public' and table_name='payments'
--     and column_name like 'refund%';
--   select proname, pronargs from pg_proc where proname='process_refund';
-- ============================================================
