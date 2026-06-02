-- ============================================================
-- AgentForge — Customer Health Score (Phase 1.5)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Computes a 0–100 health score per customer based on:
--   • subscription validity         (0–30 pts)
--   • recent activity               (0–30 pts)
--   • credit balance                (0–20 pts)
--   • repeat-purchase loyalty       (0–10 pts)
--   • engagement bonus              (0–10 pts)
--
-- Status buckets:
--   75–100  → 'healthy'      (champions, expanding)
--   50–74   → 'active'       (using product, paying)
--   25–49   → 'at_risk'      (slowing down, intervene)
--   10–24   → 'churn_risk'   (about to leave, urgent)
--   0–9     → 'churned'      (effectively gone)
--
-- Cached on profiles.health_score / health_status /
-- health_computed_at — populated by refresh_customer_health()
-- per user, or refresh_all_customer_health() as a nightly job.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  Cache columns
-- ────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists health_score        int,
  add column if not exists health_status       text,
  add column if not exists health_computed_at  timestamptz;

create index if not exists profiles_health_status_idx
  on public.profiles (health_status)
  where health_status is not null;

-- ────────────────────────────────────────────────────────────
-- 2.  customer_health(user_id) — read-only computation
-- ────────────────────────────────────────────────────────────
create or replace function public.customer_health(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile         record;
  v_last_activity   timestamptz;
  v_last_payment    timestamptz;
  v_payment_count   int;

  -- Component sub-scores
  v_sub_score       int := 0;
  v_act_score       int := 0;
  v_cred_score      int := 0;
  v_loyalty_score   int := 0;
  v_eng_score       int := 0;

  v_score           int;
  v_status          text;
  v_days_since_act  int;
  v_days_to_expire  int;
begin
  select * into v_profile from public.profiles where id = p_user_id;
  if v_profile.id is null then
    return jsonb_build_object('error', 'profile not found');
  end if;

  -- Aggregates we'll need
  select max(created_at) into v_last_activity
    from public.credit_transactions
   where user_id = p_user_id;

  select max(created_at), count(*) into v_last_payment, v_payment_count
    from public.payments
   where user_id = p_user_id
     and status = 'paid';

  -- ──────── Subscription (0–30) ────────
  if v_profile.plan_expires_at is not null
     and v_profile.plan_expires_at > now() then
    v_sub_score :=
      case
        when v_profile.plan_expires_at > now() + interval '14 days' then 30
        when v_profile.plan_expires_at > now() + interval '7 days'  then 20
        else 10
      end;
  end if;

  -- ──────── Activity (0–30) ────────
  if v_last_activity is not null then
    v_act_score :=
      case
        when v_last_activity > now() - interval '3 days'  then 30
        when v_last_activity > now() - interval '7 days'  then 20
        when v_last_activity > now() - interval '14 days' then 10
        when v_last_activity > now() - interval '30 days' then 5
        else 0
      end;
  end if;

  -- ──────── Credits (0–20) ────────
  v_cred_score :=
    case
      when v_profile.credits >= 500 then 20
      when v_profile.credits >= 100 then 15
      when v_profile.credits > 0    then 10
      when v_payment_count > 0      then 5   -- empty but historically paid → renewal candidate
      else 0
    end;

  -- ──────── Loyalty / repeat buyer (0–10) ────────
  v_loyalty_score :=
    case
      when v_payment_count >= 3 then 10
      when v_payment_count = 2  then 7
      when v_payment_count = 1  then 3
      else 0
    end;

  -- ──────── Engagement bonus (0–10) ────────
  if v_last_activity is not null
     and v_last_activity > now() - interval '30 days' then
    v_eng_score := 10;
  end if;

  v_score := v_sub_score + v_act_score + v_cred_score
           + v_loyalty_score + v_eng_score;
  if v_score > 100 then v_score := 100; end if;
  if v_score < 0   then v_score := 0;   end if;

  v_status :=
    case
      when v_score >= 75 then 'healthy'
      when v_score >= 50 then 'active'
      when v_score >= 25 then 'at_risk'
      when v_score >= 10 then 'churn_risk'
      else                    'churned'
    end;

  v_days_since_act :=
    case when v_last_activity is null then null
         else extract(day from (now() - v_last_activity))::int end;
  v_days_to_expire :=
    case when v_profile.plan_expires_at is null then null
         else extract(day from (v_profile.plan_expires_at - now()))::int end;

  return jsonb_build_object(
    'score',  v_score,
    'status', v_status,
    'last_activity_at',  v_last_activity,
    'last_payment_at',   v_last_payment,
    'payment_count',     v_payment_count,
    'days_since_activity', v_days_since_act,
    'days_to_expire',    v_days_to_expire,
    'breakdown', jsonb_build_object(
      'subscription', v_sub_score,
      'activity',     v_act_score,
      'credits',      v_cred_score,
      'loyalty',      v_loyalty_score,
      'engagement',   v_eng_score
    ),
    'maxes', jsonb_build_object(
      'subscription', 30,
      'activity',     30,
      'credits',      20,
      'loyalty',      10,
      'engagement',   10
    )
  );
end;
$$;

revoke all on function public.customer_health(uuid) from public;
grant execute on function public.customer_health(uuid) to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 3.  refresh_customer_health — recomputes + caches one user
-- ────────────────────────────────────────────────────────────
create or replace function public.refresh_customer_health(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  v := public.customer_health(p_user_id);
  if v ? 'error' then return v; end if;

  update public.profiles
     set health_score       = (v ->> 'score')::int,
         health_status      = v ->> 'status',
         health_computed_at = now()
   where id = p_user_id;

  return v;
end;
$$;

revoke all on function public.refresh_customer_health(uuid) from public;
grant execute on function public.refresh_customer_health(uuid) to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 4.  refresh_all_customer_health — nightly batch helper
-- ────────────────────────────────────────────────────────────
-- Skips Free / no-activity profiles to keep it light. Run from
-- a Supabase cron, an n8n job, or click the "Refresh all" button
-- in the customers list.
-- ────────────────────────────────────────────────────────────
create or replace function public.refresh_all_customer_health()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  r record;
begin
  if not (
    current_user in ('service_role', 'postgres')
    or public.has_permission('customers.view')
    or public.has_permission('*')
  ) then
    raise exception 'refresh_all_customer_health: caller lacks permission';
  end if;

  for r in
    select id from public.profiles
     where plan is not null
        or credits > 0
        or exists (
          select 1 from public.payments
           where user_id = profiles.id and status = 'paid'
        )
  loop
    perform public.refresh_customer_health(r.id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.refresh_all_customer_health() from public;
grant execute on function public.refresh_all_customer_health() to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 5.  Initial backfill — compute once for everyone
-- ────────────────────────────────────────────────────────────
-- Safe to run multiple times.
-- ────────────────────────────────────────────────────────────
do $$
declare
  r record;
begin
  for r in select id from public.profiles loop
    perform public.refresh_customer_health(r.id);
  end loop;
end$$;

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- select health_status, count(*)
--   from public.profiles
--   group by health_status
--   order by count(*) desc;
-- select public.customer_health('<some-user-uuid>'::uuid);
-- ============================================================
