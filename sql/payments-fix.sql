-- ============================================================
-- AgentForge payments — atomic, idempotent credit add
-- Run this in Supabase SQL Editor (production).
-- ============================================================
-- WHY THIS EXISTS
-- ----------------
-- The original verify-payment + webhook routes did:
--   1. SELECT credits  FROM profiles
--   2. UPDATE profiles SET credits = old + N
--   3. INSERT INTO payments (... plan_name, credits, currency, raw_payload ...)
--
-- The table columns are actually `plan` and `credits_added` (no
-- `currency` or `raw_payload`), so step 3 always failed with
-- "column plan_name does not exist". Step 2 had already added
-- credits — so Razorpay retried the webhook ~10 times and credits
-- got added 10× while ZERO payment rows were ever recorded.
--
-- Fix: one atomic SQL function that does INSERT first (with
-- ON CONFLICT DO NOTHING for idempotency), and only if the
-- insert actually wrote a row, it increments credits + logs to
-- credit_transactions. Same payment_id replayed -> no-op.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  Ensure razorpay_payment_id has a UNIQUE constraint
--     (drives ON CONFLICT idempotency)
-- ────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'payments'
      and c.contype = 'u'
      and c.conkey @> array[
        (select attnum from pg_attribute
          where attrelid = 'public.payments'::regclass
            and attname = 'razorpay_payment_id')
      ]
  ) then
    alter table public.payments
      add constraint payments_razorpay_payment_id_key
      unique (razorpay_payment_id);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────
-- 2.  Atomic, idempotent add_credits_for_payment
-- ────────────────────────────────────────────────────────────
-- Behavior:
--   • Inserts a payments row (ON CONFLICT DO NOTHING on
--     razorpay_payment_id).
--   • If the insert produced a NEW row → increments
--     profiles.credits by p_credits, sets plan, writes an audit
--     row in credit_transactions. Returns added=true.
--   • If the insert hit a conflict (same payment_id again) →
--     returns added=false with the user's current balance, makes
--     no changes. Safe for unlimited webhook retries.
--
-- All three writes happen in one transaction. Any failure
-- rolls back the whole thing, so credits cannot be added
-- without a corresponding payments row, and vice versa.
-- ────────────────────────────────────────────────────────────

create or replace function public.add_credits_for_payment(
  p_user_id              uuid,
  p_amount               numeric,    -- rupees (matches payments.amount)
  p_credits              bigint,     -- credits to add (matches credits_added)
  p_plan                 text,
  p_razorpay_order_id    text,
  p_razorpay_payment_id  text,
  p_razorpay_signature   text
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

  -- Step 1: idempotent payment insert
  insert into public.payments (
    user_id,
    plan,
    amount,
    credits_added,
    status,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  ) values (
    p_user_id,
    p_plan,
    p_amount,
    p_credits,
    'paid',
    p_razorpay_order_id,
    p_razorpay_payment_id,
    p_razorpay_signature
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

  -- Step 2: atomic credit increment + plan set
  update public.profiles
     set credits    = credits + p_credits,
         plan       = p_plan,
         updated_at = now()
   where id = p_user_id
   returning credits into v_balance;

  if v_balance is null then
    -- Profile must exist; rollback the whole transaction.
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

-- ────────────────────────────────────────────────────────────
-- 3.  Lock down EXECUTE — only the server (service_role) can call.
-- ────────────────────────────────────────────────────────────
revoke all on function public.add_credits_for_payment(
  uuid, numeric, bigint, text, text, text, text
) from public;

grant execute on function public.add_credits_for_payment(
  uuid, numeric, bigint, text, text, text, text
) to service_role;

-- ────────────────────────────────────────────────────────────
-- 4.  Verification queries (run manually to confirm)
-- ────────────────────────────────────────────────────────────
-- -- Unique constraint present?
-- SELECT conname FROM pg_constraint
-- WHERE conrelid = 'public.payments'::regclass AND contype = 'u';
--
-- -- Function present + grants?
-- SELECT proname FROM pg_proc WHERE proname = 'add_credits_for_payment';
-- ============================================================
