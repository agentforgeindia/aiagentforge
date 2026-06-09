-- ============================================================
-- AgentForge — Influencer earnings tracking + withdrawals
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- Problem: when a referred user buys a plan, nothing was inserted into
-- referral_earnings, so the influencer's SALES / EARNED stayed ₹0.
--
-- This script:
--   1. record_referral_earning() — call after each successful payment;
--      records the influencer's commission (idempotent per order).
--   2. Backfills referral_earnings for all EXISTING paid payments whose
--      buyer signed up via an influencer referral code.
--   3. influencer_withdrawals table + request_influencer_withdrawal()
--      so creators can request a payout (settled within 24 hours).
-- ============================================================

-- Default commission rate (percent of purchase amount).
-- Matches referral_earnings.commission_pct default of 10.
-- Change here if the business rate changes.

-- ────────────────────────────────────────────────────────────
-- 1. record_referral_earning(user_id, order_id, amount)
--    Looks up the buyer's referral code (profiles.referred_by). If it
--    belongs to an active influencer (content_creator_social), inserts
--    a commission row. Idempotent on order_id so re-runs are safe.
-- ────────────────────────────────────────────────────────────
create or replace function public.record_referral_earning(
  p_user_id  uuid,
  p_order_id text,
  p_amount   numeric
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_code   text;
  v_cid    uuid;
  v_pct    numeric := 10;          -- commission percent
  v_comm   numeric;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'no user');
  end if;

  -- Which code did this buyer sign up under?
  select referred_by into v_code from public.profiles where id = p_user_id;
  if v_code is null or length(trim(v_code)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'buyer not referred');
  end if;

  -- Is that code an influencer's code?
  select candidate_id into v_cid
    from public.content_creator_social
   where upper(referral_code) = upper(trim(v_code))
   limit 1;

  if v_cid is null then
    -- Code belongs to a normal customer referral, not an influencer.
    return jsonb_build_object('ok', false, 'reason', 'not an influencer code');
  end if;

  -- Already recorded for this order? (idempotent)
  if p_order_id is not null and exists (
    select 1 from public.referral_earnings
     where order_id = p_order_id
  ) then
    return jsonb_build_object('ok', true, 'reason', 'already recorded');
  end if;

  v_comm := round(coalesce(p_amount, 0) * v_pct / 100.0, 2);

  insert into public.referral_earnings (
    referral_code, candidate_id, order_id,
    purchase_amount, commission_pct, commission_amount, status
  ) values (
    upper(trim(v_code)), v_cid, p_order_id,
    p_amount, v_pct, v_comm, 'pending'
  );

  return jsonb_build_object('ok', true, 'commission', v_comm, 'candidate_id', v_cid);
exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end$$;

revoke all on function public.record_referral_earning(uuid, text, numeric) from public, anon;
grant execute on function public.record_referral_earning(uuid, text, numeric) to service_role;

-- ────────────────────────────────────────────────────────────
-- 2. BACKFILL — record earnings for existing paid payments whose
--    buyer was referred by an influencer (and not already recorded).
-- ────────────────────────────────────────────────────────────
insert into public.referral_earnings (
  referral_code, candidate_id, order_id,
  purchase_amount, commission_pct, commission_amount, status
)
select
  upper(trim(pr.referred_by)),
  css.candidate_id,
  pay.razorpay_order_id,
  pay.amount,
  10,
  round(pay.amount * 10 / 100.0, 2),
  'pending'
from public.payments pay
join public.profiles pr               on pr.id = pay.user_id
join public.content_creator_social css
     on upper(css.referral_code) = upper(trim(pr.referred_by))
where pay.status = 'paid'
  and pr.referred_by is not null
  and not exists (
    select 1 from public.referral_earnings re
     where re.order_id = pay.razorpay_order_id
  );

-- ────────────────────────────────────────────────────────────
-- 3. Withdrawals
-- ────────────────────────────────────────────────────────────
create table if not exists public.influencer_withdrawals (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references public.candidates(id) on delete cascade,
  referral_code text not null,
  amount        numeric(10,2) not null,
  status        text not null default 'requested'
                  check (status in ('requested','processing','paid','rejected')),
  upi_id        text,
  account_note  text,
  admin_note    text,
  requested_at  timestamptz not null default now(),
  processed_at  timestamptz
);

create index if not exists iw_candidate_idx on public.influencer_withdrawals (candidate_id);

-- RazorpayX payout columns (added idempotently for existing installs)
alter table public.influencer_withdrawals
  add column if not exists payout_id        text,   -- RazorpayX payout id (pout_...)
  add column if not exists contact_id       text,   -- RazorpayX contact id (cont_...)
  add column if not exists fund_account_id  text,   -- RazorpayX fund account id (fa_...)
  add column if not exists payout_mode      text,   -- UPI | IMPS | NEFT
  add column if not exists failure_reason   text;

-- Allow the new 'failed' status as well.
do $$
begin
  alter table public.influencer_withdrawals drop constraint if exists influencer_withdrawals_status_check;
  alter table public.influencer_withdrawals
    add constraint influencer_withdrawals_status_check
    check (status in ('requested','processing','paid','rejected','failed'));
exception when others then null;
end$$;

alter table public.influencer_withdrawals enable row level security;
drop policy if exists "iw_public_read" on public.influencer_withdrawals;
create policy "iw_public_read" on public.influencer_withdrawals for select using (true);
drop policy if exists "iw_service_write" on public.influencer_withdrawals;
create policy "iw_service_write" on public.influencer_withdrawals for all
  to service_role using (true) with check (true);

-- request_influencer_withdrawal(cid, upi) — validates the available
-- balance and creates a withdrawal request. Available = sum of pending
-- commission MINUS amounts already requested/processing/paid.
create or replace function public.request_influencer_withdrawal(
  p_cid uuid,
  p_upi text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_code      text;
  v_earned    numeric;
  v_withdrawn numeric;
  v_available numeric;
  v_id        uuid;
begin
  select referral_code into v_code
    from public.content_creator_social where candidate_id = p_cid limit 1;
  if v_code is null then
    return jsonb_build_object('ok', false, 'error', 'Not an influencer.');
  end if;

  -- already an open request?
  if exists (
    select 1 from public.influencer_withdrawals
     where candidate_id = p_cid and status in ('requested','processing')
  ) then
    return jsonb_build_object('ok', false, 'error', 'You already have a withdrawal in progress.');
  end if;

  select coalesce(sum(commission_amount),0) into v_earned
    from public.referral_earnings where upper(referral_code) = upper(v_code);

  select coalesce(sum(amount),0) into v_withdrawn
    from public.influencer_withdrawals
   where candidate_id = p_cid and status in ('requested','processing','paid');

  v_available := v_earned - v_withdrawn;

  if v_available <= 0 then
    return jsonb_build_object('ok', false, 'error', 'No balance available to withdraw.');
  end if;

  insert into public.influencer_withdrawals (candidate_id, referral_code, amount, upi_id, status)
  values (p_cid, upper(v_code), v_available, p_upi, 'requested')
  returning id into v_id;

  -- Notify admin (best-effort)
  begin
    insert into public.recruitment_notifications (candidate_id, candidate_name, role_slug, event_type, details)
    select p_cid, c.name, 'content-creator', 'withdrawal_requested',
           jsonb_build_object('amount', v_available, 'upi', p_upi, 'referral_code', upper(v_code))
      from public.candidates c where c.id = p_cid;
  exception when others then null;
  end;

  return jsonb_build_object('ok', true, 'amount', v_available, 'withdrawal_id', v_id);
exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end$$;

revoke all on function public.request_influencer_withdrawal(uuid, text) from public, anon;
grant execute on function public.request_influencer_withdrawal(uuid, text) to service_role;

-- ────────────────────────────────────────────────────────────
-- Verify:
-- ────────────────────────────────────────────────────────────
-- select referral_code, count(*), sum(commission_amount)
--   from public.referral_earnings group by referral_code;
-- ============================================================
