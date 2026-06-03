-- ============================================================
-- AgentForge — Subscription tracking (Phase 1.2)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Adds plan validity windows to profiles:
--   plan_purchased_at      — when the active plan was bought.
--   plan_expires_at        — when it stops being "active".
--   last_renewal_alert_at  — when we last surfaced an alert.
--
-- Updates add_credits_for_payment to set these every time a
-- payment is recorded. Each purchase resets the validity to
-- 30 days from the moment of payment.
--
-- Adds new permissions:
--   subscriptions.view, subscriptions.extend, subscriptions.create_task
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  Profile columns
-- ────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists plan_purchased_at     timestamptz,
  add column if not exists plan_expires_at       timestamptz,
  add column if not exists last_renewal_alert_at timestamptz;

create index if not exists profiles_plan_expires_idx
  on public.profiles (plan_expires_at)
  where plan_expires_at is not null;

-- ────────────────────────────────────────────────────────────
-- 2.  Updated RPC — stamps purchased_at + expires_at on payment
-- ────────────────────────────────────────────────────────────
-- Signature is unchanged from sql/billing-snapshot.sql; only the
-- profile UPDATE block is augmented with the two new columns.
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

  -- Profile update — credits + plan + subscription window +
  -- latest billing details cache (only when caller sent them).
  update public.profiles
     set credits             = credits + p_credits,
         plan                = p_plan,
         plan_purchased_at   = now(),
         plan_expires_at     = now() + interval '30 days',
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
$$;

revoke all on function public.add_credits_for_payment(
  uuid, numeric, bigint, text, text, text, text,
  text, text, text, text, text, text
) from public;
grant execute on function public.add_credits_for_payment(
  uuid, numeric, bigint, text, text, text, text,
  text, text, text, text, text, text
) to service_role;

-- ────────────────────────────────────────────────────────────
-- 3.  Backfill — derive expiry from each user's latest payment.
-- ────────────────────────────────────────────────────────────
-- Safe to run multiple times. Skips users we already filled.
-- ────────────────────────────────────────────────────────────

with latest as (
  select user_id,
         max(created_at) as last_paid_at
    from public.payments
   where status = 'paid'
   group by user_id
)
update public.profiles p
   set plan_purchased_at = l.last_paid_at,
       plan_expires_at   = l.last_paid_at + interval '30 days'
  from latest l
 where p.id = l.user_id
   and (p.plan_purchased_at is null or p.plan_expires_at is null);

-- ────────────────────────────────────────────────────────────
-- 4.  Manual extender — used by /admin/subscriptions UI
-- ────────────────────────────────────────────────────────────
-- Adds N days to the user's plan_expires_at (or starts a fresh
-- 30-day window if there is none). Audited via log_admin_action
-- from the client.
-- ────────────────────────────────────────────────────────────

create or replace function public.extend_subscription(
  p_user_id uuid,
  p_days    int default 30
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new timestamptz;
begin
  if not public.has_permission('subscriptions.extend') then
    raise exception 'extend_subscription: caller lacks subscriptions.extend';
  end if;
  if p_days is null or p_days <= 0 then
    raise exception 'extend_subscription: days must be positive';
  end if;

  update public.profiles
     set plan_expires_at = coalesce(plan_expires_at, now()) + (p_days || ' days')::interval,
         updated_at = now()
   where id = p_user_id
   returning plan_expires_at into v_new;

  if v_new is null then
    raise exception 'extend_subscription: profile % not found', p_user_id;
  end if;

  return v_new;
end;
$$;

revoke all on function public.extend_subscription(uuid, int) from public;
grant execute on function public.extend_subscription(uuid, int) to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 5.  New permissions on existing roles
-- ────────────────────────────────────────────────────────────
update public.admin_roles
   set permissions = array(
     select distinct unnest(permissions || ARRAY[
       'subscriptions.view',
       'subscriptions.extend',
       'subscriptions.create_task'
     ])
   ),
   updated_at = now()
 where id = 'admin';

update public.admin_roles
   set permissions = array(
     select distinct unnest(permissions || ARRAY[
       'subscriptions.view',
       'subscriptions.extend',
       'subscriptions.create_task'
     ])
   ),
   updated_at = now()
 where id = 'accounts';

update public.admin_roles
   set permissions = array(
     select distinct unnest(permissions || ARRAY[
       'subscriptions.view',
       'subscriptions.create_task'
     ])
   ),
   updated_at = now()
 where id = 'sales';

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- select id, email, plan, plan_purchased_at, plan_expires_at
--   from public.profiles
--   where plan_expires_at is not null
--   order by plan_expires_at;
-- ============================================================
