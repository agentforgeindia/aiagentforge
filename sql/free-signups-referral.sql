-- ============================================================
-- AgentForge — free_signups(): add referred_by + reload schema cache
-- Run this in Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- Two things this fixes:
--   1. The admin Leads → Free signups list was empty in the browser
--      even though free_signups() returns rows in the SQL editor. The
--      usual cause is a STALE PostgREST schema cache after the function
--      was (re)created — the API can't find the new signature and the
--      front-end silently shows "no signups". The NOTIFY at the bottom
--      forces PostgREST to reload immediately.
--   2. Adds referred_by so the admin can see which signups came in
--      through a referral link (shown as a "Referral · CODE" badge).
-- ============================================================

-- Return type changes → must DROP before recreate.
drop function if exists public.free_signups(int, int);

create function public.free_signups(
  p_limit int default 200,
  p_days  int default 90
)
returns table (
  id                uuid,
  email             text,
  full_name         text,
  created_at        timestamptz,
  credits           bigint,
  utm_source        text,
  utm_campaign      text,
  utm_medium        text,
  referred_by       text,
  has_phone         boolean,
  last_activity_at  timestamptz
)
language sql stable security definer set search_path = public
as $$
  select
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    p.credits,
    p.utm_source,
    p.utm_campaign,
    p.utm_medium,
    p.referred_by,
    (p.billing_phone is not null and length(trim(p.billing_phone)) > 0) as has_phone,
    (
      select max(ct.created_at)
        from public.credit_transactions ct
       where ct.user_id = p.id
    ) as last_activity_at
  from public.profiles p
  where p.email is not null
    and (p.plan is null or lower(p.plan) in ('free', 'free trial'))
    and p.created_at >= now() - (p_days || ' days')::interval
    and not exists (
      select 1 from public.payments
       where user_id = p.id and status = 'paid'
    )
    and not exists (
      select 1 from public.leads l
       where l.converted_user_id = p.id
          or (l.email is not null and lower(l.email) = lower(p.email))
    )
  order by p.created_at desc
  limit greatest(p_limit, 1);
$$;

revoke all on function public.free_signups(int, int) from public;
grant execute on function public.free_signups(int, int) to authenticated, service_role;

-- Force PostgREST to pick up the new function signature right away.
notify pgrst, 'reload schema';

-- ────────────────────────────────────────────────────────────
-- Verify (should match what the admin page will now show):
-- ────────────────────────────────────────────────────────────
-- select count(*) from public.free_signups(500, 90);
-- select email, referred_by from public.free_signups(50, 90) where referred_by is not null;
-- ============================================================
