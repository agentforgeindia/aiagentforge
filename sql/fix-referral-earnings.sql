-- ============================================================
-- AgentForge — Fix referral earnings: dedup by payment, clean 10%
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- Problem: SALES showed 2 (and EARNED doubled) because earnings were
-- keyed on order_id, which could be null/duplicated, so the same buyer's
-- payments produced extra rows.
--
-- Fix: key every earning on the payment's unique razorpay_payment_id, so
-- each real paid plan = exactly ONE earning row at a fixed 10% commission.
-- Then REBUILD the table cleanly from the payments table.
-- ============================================================

-- ── 1. Add payment_id + a UNIQUE guard so a payment can never be
--       recorded twice. ──────────────────────────────────────────
alter table public.referral_earnings
  add column if not exists payment_id text;

create unique index if not exists re_payment_unique
  on public.referral_earnings (payment_id)
  where payment_id is not null;

-- ── 2. record_referral_earning() — now dedups on payment_id ──────
drop function if exists public.record_referral_earning(uuid, text, numeric);

create or replace function public.record_referral_earning(
  p_user_id    uuid,
  p_order_id   text,
  p_amount     numeric,
  p_payment_id text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
  v_cid  uuid;
  v_pct  numeric := 10;          -- FIXED 10% commission
  v_comm numeric;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'no user');
  end if;

  select referred_by into v_code from public.profiles where id = p_user_id;
  if v_code is null or length(trim(v_code)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'buyer not referred');
  end if;

  select candidate_id into v_cid
    from public.content_creator_social
   where upper(referral_code) = upper(trim(v_code))
   limit 1;
  if v_cid is null then
    return jsonb_build_object('ok', false, 'reason', 'not an influencer code');
  end if;

  -- Idempotent on the payment (preferred) or order id.
  if p_payment_id is not null and exists (
    select 1 from public.referral_earnings where payment_id = p_payment_id
  ) then
    return jsonb_build_object('ok', true, 'reason', 'already recorded');
  end if;
  if p_payment_id is null and p_order_id is not null and exists (
    select 1 from public.referral_earnings where order_id = p_order_id
  ) then
    return jsonb_build_object('ok', true, 'reason', 'already recorded');
  end if;

  v_comm := round(coalesce(p_amount, 0) * v_pct / 100.0, 2);

  insert into public.referral_earnings (
    referral_code, candidate_id, order_id, payment_id,
    purchase_amount, commission_pct, commission_amount, status
  ) values (
    upper(trim(v_code)), v_cid, p_order_id, p_payment_id,
    p_amount, v_pct, v_comm, 'pending'
  )
  on conflict (payment_id) where payment_id is not null do nothing;

  return jsonb_build_object('ok', true, 'commission', v_comm, 'candidate_id', v_cid);
exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end$$;

revoke all on function public.record_referral_earning(uuid, text, numeric, text) from public, anon;
grant execute on function public.record_referral_earning(uuid, text, numeric, text) to service_role;

-- ── 3. REBUILD — wipe and re-derive one clean row per paid payment.
--       Only payments that are NOT already withdrawn/paid keep their
--       'pending' status. (We don't touch withdrawals here.) ───────
delete from public.referral_earnings;

insert into public.referral_earnings (
  referral_code, candidate_id, order_id, payment_id,
  purchase_amount, commission_pct, commission_amount, status, created_at
)
select distinct on (pay.razorpay_payment_id)
  upper(trim(pr.referred_by)),
  css.candidate_id,
  pay.razorpay_order_id,
  pay.razorpay_payment_id,
  pay.amount,
  10,
  round(pay.amount * 10 / 100.0, 2),
  'pending',
  pay.created_at
from public.payments pay
join public.profiles pr               on pr.id = pay.user_id
join public.content_creator_social css
     on upper(css.referral_code) = upper(trim(pr.referred_by))
where pay.status = 'paid'
  and pr.referred_by is not null
  and pay.razorpay_payment_id is not null
order by pay.razorpay_payment_id, pay.created_at asc;

-- ── 4. DIAGNOSTIC — see exactly what's counted, per influencer ───
-- Run these to verify the numbers match reality:

-- 4a. All paid payments made by referred buyers (the source of truth):
-- select pr.email as buyer, css.referral_code, pay.amount, pay.plan,
--        pay.razorpay_payment_id, pay.created_at
--   from public.payments pay
--   join public.profiles pr on pr.id = pay.user_id
--   join public.content_creator_social css
--        on upper(css.referral_code) = upper(trim(pr.referred_by))
--  where pay.status = 'paid'
--  order by pay.created_at desc;

-- 4b. Earnings summary per influencer code:
-- select referral_code,
--        count(*)                    as sales,
--        sum(purchase_amount)        as total_purchase_value,
--        sum(commission_amount)      as total_commission
--   from public.referral_earnings
--  group by referral_code;
-- ============================================================
