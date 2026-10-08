-- ============================================================
-- 05 — Plans are lifetime; Empire is 36,000 credits, not unlimited
--                                               (NOT applied yet)
-- ============================================================
-- Two decisions of 2026-10-08:
--
--   1. No monthly plans. A plan is a one-time purchase with lifetime
--      access; bought credits never expire.
--        • add_credits_for_payment() no longer sets a 30-day expiry
--          on a purchase (plan_expires_at is cleared instead).
--        • Customers who already paid get their expiry date cleared.
--          Checked on 2026-10-08: 1 such profile. Time-limited access
--          given by hand in Admin → Credits → Grant is left as it is.
--      Nothing in the app ever switched a plan off at that date — it
--      was only shown in Admin → Subscriptions and used for renewal
--      reminder e-mails. So this changes what is displayed and
--      reminded, not what any customer can do today.
--
--   2. Empire = 36,000 credits. deduct_team_credits() treated a TEAM
--      on the Empire plan as unlimited (no credits deducted). Empire
--      is removed from that list; only the internal Founder /
--      Unlimited plans stay unlimited.
--      Checked on 2026-10-08: no team is on the Empire plan (1 team,
--      plan "free"), so no customer's behaviour changes today.
--
-- Both functions are otherwise byte-for-byte the live definitions.
-- Deploy order: with or after the new code (either order works).
-- Rollback: sql/rollback/05-lifetime-plans-and-empire-credits.rollback.sql
-- ============================================================

begin;

CREATE OR REPLACE FUNCTION public.add_credits_for_payment(p_user_id uuid, p_amount numeric, p_credits bigint, p_plan text, p_razorpay_order_id text, p_razorpay_payment_id text, p_razorpay_signature text, p_billing_name text DEFAULT NULL::text, p_billing_phone text DEFAULT NULL::text, p_billing_email text DEFAULT NULL::text, p_billing_company text DEFAULT NULL::text, p_billing_address text DEFAULT NULL::text, p_billing_gstin text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  insert into public.payments (
    user_id, plan, amount, credits_added, status,
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    billing_name, billing_phone, billing_email,
    billing_company, billing_address, billing_gstin
  ) values (
    p_user_id, p_plan, p_amount, p_credits, 'paid',
    p_razorpay_order_id, p_razorpay_payment_id, p_razorpay_signature,
    p_billing_name, p_billing_phone, p_billing_email,
    p_billing_company, p_billing_address, p_billing_gstin
  )
  on conflict (razorpay_payment_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    select credits into v_balance
      from public.profiles where id = p_user_id;
    return jsonb_build_object(
      'added',         false,
      'credits_added', 0,
      'new_balance',   coalesce(v_balance, 0)
    );
  end if;

  -- Profile update — credits + plan (lifetime, no expiry) +
  -- latest billing details cache (only when caller sent them).
  update public.profiles
     set credits             = credits + p_credits,
         plan                = p_plan,
         plan_purchased_at   = now(),
         plan_expires_at     = null,          -- plans are lifetime (2026-10-08): no expiry
         last_renewal_alert_at = null,
         billing_name        = coalesce(p_billing_name,    billing_name),
         billing_phone       = coalesce(p_billing_phone,   billing_phone),
         billing_company     = coalesce(p_billing_company, billing_company),
         billing_address     = coalesce(p_billing_address, billing_address),
         billing_gstin       = coalesce(p_billing_gstin,   billing_gstin),
         updated_at          = now()
   where id = p_user_id
   returning credits into v_balance;

  if v_balance is null then
    raise exception 'add_credits_for_payment: profile % not found', p_user_id;
  end if;

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
$function$;

CREATE OR REPLACE FUNCTION public.deduct_team_credits(p_team_id uuid, p_actor_id uuid, p_amount bigint, p_reason text DEFAULT 'generate'::text, p_generation_id text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan    TEXT;
  v_balance BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'deduct_team_credits: amount must be positive';
  END IF;

  SELECT plan INTO v_plan FROM public.teams WHERE id = p_team_id FOR UPDATE;

  -- Empire is a 36,000-credit plan, not unlimited (2026-10-08).
  -- Only the internal Founder / Unlimited plans skip deduction.
  IF v_plan IN ('Founder', 'Unlimited') THEN
    SELECT credits INTO v_balance FROM public.teams WHERE id = p_team_id;
    INSERT INTO public.team_credit_transactions (team_id, actor_user_id, delta, reason, generation_id, balance_after)
    VALUES (p_team_id, p_actor_id, 0, p_reason || ':unlimited', p_generation_id, v_balance);
    RETURN v_balance;
  END IF;

  UPDATE public.teams
     SET credits    = credits - p_amount,
         updated_at = NOW()
   WHERE id = p_team_id
     AND credits >= p_amount
  RETURNING credits INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN NULL; -- caller maps to HTTP 402
  END IF;

  INSERT INTO public.team_credit_transactions (team_id, actor_user_id, delta, reason, generation_id, balance_after)
  VALUES (p_team_id, p_actor_id, -p_amount, p_reason, p_generation_id, v_balance);

  RETURN v_balance;
END;
$function$;

-- Lifetime for customers who already paid.
update public.profiles p
   set plan_expires_at = null,
       last_renewal_alert_at = null
 where p.plan_expires_at is not null
   and exists (select 1 from public.payments y where y.user_id = p.id and y.status = 'paid');

commit;
