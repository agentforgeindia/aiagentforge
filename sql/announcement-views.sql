-- ============================================================
-- Announcement SEEN tracking (per-user) + Paid/Free/Lead detail
-- Run this once in the Supabase SQL Editor (production).
-- ============================================================
-- Broadcast announcements (the bell) had no per-user "seen" record
-- — only a client-side localStorage flag. This adds a real table so
-- the admin can see WHO opened each announcement and whether they are
-- a paying customer, a free signup, or a CRM lead.
--
--   record_announcement_seen(ids)   — called by the user bell on open
--   announcement_seen_summary()     — per-announcement counts (admin)
--   announcement_seen_detail(id)    — per-user breakdown (admin)
-- ============================================================

create table if not exists public.announcement_views (
  announcement_id uuid not null
    references public.announcements(id) on delete cascade,
  user_id         uuid not null,
  seen_at         timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create index if not exists announcement_views_ann_idx
  on public.announcement_views (announcement_id, seen_at desc);

-- RLS on; no direct policies — all access goes through the
-- SECURITY DEFINER functions below.
alter table public.announcement_views enable row level security;

-- ────────────────────────────────────────────────────────────
-- 1. Record a seen — the logged-in user's bell calls this on open.
--    Idempotent (PK on announcement_id+user_id).
-- ────────────────────────────────────────────────────────────
create or replace function public.record_announcement_seen(p_ids uuid[])
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or p_ids is null then return; end if;
  insert into public.announcement_views (announcement_id, user_id)
  select distinct unnest(p_ids), auth.uid()
  on conflict do nothing;
end$$;

revoke all on function public.record_announcement_seen(uuid[]) from public;
grant execute on function public.record_announcement_seen(uuid[]) to authenticated;

-- ────────────────────────────────────────────────────────────
-- 2. Per-announcement counts for the admin list (seen + paid).
-- ────────────────────────────────────────────────────────────
create or replace function public.announcement_seen_summary()
returns table (announcement_id uuid, seen_count bigint, paid_count bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then return; end if;
  return query
  select v.announcement_id,
         count(*)::bigint as seen_count,
         count(*) filter (
           where exists (
             select 1 from public.payments p
              where p.user_id = v.user_id and p.status = 'paid'
           )
         )::bigint as paid_count
    from public.announcement_views v
   group by v.announcement_id;
end$$;

revoke all on function public.announcement_seen_summary() from public;
grant execute on function public.announcement_seen_summary() to authenticated;

-- ────────────────────────────────────────────────────────────
-- 3. Per-user breakdown for ONE announcement (admin, on expand).
--    is_paid → has a paid payment; is_lead → email is in CRM leads.
-- ────────────────────────────────────────────────────────────
create or replace function public.announcement_seen_detail(p_announcement_id uuid)
returns table (email text, seen_at timestamptz, is_paid boolean, is_lead boolean)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then return; end if;
  return query
  select
    u.email::text,
    v.seen_at,
    exists (
      select 1 from public.payments p
       where p.user_id = v.user_id and p.status = 'paid'
    ) as is_paid,
    exists (
      select 1 from public.leads l
       where lower(l.email) = lower(u.email)
    ) as is_lead
  from public.announcement_views v
  join auth.users u on u.id = v.user_id
  where v.announcement_id = p_announcement_id
  order by v.seen_at desc;
end$$;

revoke all on function public.announcement_seen_detail(uuid) from public;
grant execute on function public.announcement_seen_detail(uuid) to authenticated;

-- Verify:
-- select * from public.announcement_seen_summary();
-- ============================================================
