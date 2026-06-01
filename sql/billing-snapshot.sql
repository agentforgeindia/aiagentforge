-- ============================================================
-- AgentForge — billing snapshot fields on payments + profiles
-- Run this in Supabase SQL Editor.
-- ============================================================
-- WHY
-- ---
-- The downloadable bill needs billing details (name, phone,
-- company, address, optional GSTIN). We collect these in a
-- modal right before Razorpay checkout opens.
--
-- payments.billing_*  → FROZEN at the moment of purchase. Old
--                       bills never change even if the user
--                       later updates their details.
-- profiles.billing_*  → LATEST values, used to pre-fill the
--                       form on the next purchase.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  payments — snapshot at time of purchase
-- ────────────────────────────────────────────────────────────
alter table public.payments
  add column if not exists billing_name     text,
  add column if not exists billing_phone    text,
  add column if not exists billing_email    text,
  add column if not exists billing_company  text,
  add column if not exists billing_address  text,
  add column if not exists billing_gstin    text;

-- ────────────────────────────────────────────────────────────
-- 2.  profiles — latest billing details for re-use
-- ────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists billing_name     text,
  add column if not exists billing_phone    text,
  add column if not exists billing_company  text,
  add column if not exists billing_address  text,
  add column if not exists billing_gstin    text;

-- ────────────────────────────────────────────────────────────
-- 3.  Update add_credits_for_payment to accept + store snapshot
-- ────────────────────────────────────────────────────────────
-- New optional params at the END so existing callers keep
-- working without changes.
-- ────────────────────────────────────────────────────────────

create or replace function public.add_credits_for_payment(
  p_user_id              uuid,
  p_amount               numeric,
  p_credits              bigint,
  p_plan                 text,
  p_razorpay_order_id    text,
  p_razorpay_payment_id  text,
  p_razorpay_signature   text,
  p_billing_name         text default null,
  p_billing_phone        text default null,
  p_billing_email        text default null,
  p_billing_company      text default null,
  p_billing_address      text default null,
  p_billing_gstin        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_id uuid;
  v_balance     bigint;
begin
  if p_user_id is null then
    raise exception 'add_credits_for_payment: user_id is required';
  end if;
  if p_credits is null or p_credits <= 0 then
    raise exception 'add_credits_for_payment: credits must be positive';
  end if;
  if p_razorpay_payment_id is null or length(p_razorpay_payment_id) = 0 then
    raise exception 'add_credits_for_payment: razorpay_payment_id is required';
  end if;

  -- Step 1: idempotent payment insert (with billing snapshot)
  insert into public.payments (
    user_id,
    plan,
    amount,
    credits_added,
    status,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    billing_name,
    billing_phone,
    billing_email,
    billing_company,
    billing_address,
    billing_gstin
  ) values (
    p_user_id,
    p_plan,
    p_amount,
    p_credits,
    'paid',
    p_razorpay_order_id,
    p_razorpay_payment_id,
    p_razorpay_signature,
    p_billing_name,
    p_billing_phone,
    p_billing_email,
    p_billing_company,
    p_billing_address,
    p_billing_gstin
  )
  on conflict (razorpay_payment_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    -- Duplicate payment_id → already processed. No change.
    select credits into v_balance
      from public.profiles
     where id = p_user_id;

    return jsonb_build_object(
      'added',         false,
      'credits_added', 0,
      'new_balance',   coalesce(v_balance, 0)
    );
  end if;

  -- Step 2: atomic credit increment + plan set + latest billing
  -- details cached on profile (only when caller sent them).
  update public.profiles
     set credits        = credits + p_credits,
         plan           = p_plan,
         billing_name   = coalesce(p_billing_name,    billing_name),
         billing_phone  = coalesce(p_billing_phone,   billing_phone),
         billing_company= coalesce(p_billing_company, billing_company),
         billing_address= coalesce(p_billing_address, billing_address),
         billing_gstin  = coalesce(p_billing_gstin,   billing_gstin),
         updated_at     = now()
   where id = p_user_id
   returning credits into v_balance;

  if v_balance is null then
    raise exception 'add_credits_for_payment: profile % not found', p_user_id;
  end if;

  -- Step 3: audit trail
  insert into public.credit_transactions(
    user_id, delta, reason, generation_id, balance_after
  ) values (
    p_user_id,
    p_credits,
    'payment:' || coalesce(p_plan, 'unknown'),
    p_razorpay_payment_id,
    v_balance
  );

  return jsonb_build_object(
    'added',         true,
    'credits_added', p_credits,
    'new_balance',   v_balance
  );
end;
$$;

-- Re-grant (signature changed → drop old grants implicitly)
revoke all on function public.add_credits_for_payment(
  uuid, numeric, bigint, text, text, text, text,
  text, text, text, text, text, text
) from public;
grant execute on function public.add_credits_for_payment(
  uuid, numeric, bigint, text, text, text, text,
  text, text, text, text, text, text
) to service_role;

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='payments'
--     and column_name like 'billing_%';
-- select proname, pronargs from pg_proc
--   where proname = 'add_credits_for_payment';
-- ============================================================
