-- ============================================================
-- AgentForge — Signup-to-Lead bridge (Phase 1.6)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Adds two helpers + a unique index so the same profile can't be
-- linked to multiple leads.
--
-- 1. profiles_lead_link_idx           — unique on leads.converted_user_id
--                                       so promote-to-lead is idempotent.
-- 2. find_lead_for_profile(user_id)   — returns the existing lead id (or null)
-- 3. free_signups(limit_count, days)  — list signed-up users who have NOT
--                                       paid and are NOT yet in leads,
--                                       sorted by most recent.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  Idempotency — one lead per profile (when linked).
-- ────────────────────────────────────────────────────────────
create unique index if not exists leads_converted_user_unique
  on public.leads (converted_user_id)
  where converted_user_id is not null;

-- ────────────────────────────────────────────────────────────
-- 2.  Helper: find an existing lead row for a profile.
-- ────────────────────────────────────────────────────────────
create or replace function public.find_lead_for_profile(p_user_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select l.id
    from public.leads l
   where l.converted_user_id = p_user_id
      or (
        l.email is not null
        and exists (
          select 1 from public.profiles p
           where p.id = p_user_id
             and lower(p.email) = lower(l.email)
        )
      )
   order by l.created_at asc
   limit 1;
$$;

revoke all on function public.find_lead_for_profile(uuid) from public;
grant execute on function public.find_lead_for_profile(uuid) to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 3.  free_signups — virtual leads from profiles.
-- ────────────────────────────────────────────────────────────
-- Returns recently-signed-up users who:
--   • are on a Free plan (or no plan at all)
--   • have NO successful payment yet
--   • have NO existing leads row (by email or converted_user_id)
--
-- Sorted by signup date desc. Pagination via limit/offset on
-- the client side.
-- ────────────────────────────────────────────────────────────
create or replace function public.free_signups(
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
  referrer          text,
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
    p.referrer,
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

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- select count(*) from public.free_signups(500, 90);
-- select * from public.free_signups(20, 30);
-- select public.find_lead_for_profile('e84c1754-4968-4dab-8634-01bbbf2dfa68'::uuid);
-- ============================================================
