-- ============================================================
-- AgentForge — USER-facing notifications (the navbar bell)
-- Separate from admin notifications (sql/notifications.sql).
-- Run this WHOLE file in Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- 1. announcements      — broadcast (admin posts -> everyone's bell)
-- 2. user_notifications — per-user (welcome, payment, etc.)
-- 3. add_user_notification() helper (server / triggers)
-- 4. welcome trigger on signup
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Broadcast announcements
-- ────────────────────────────────────────────────────────────
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  link        text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists announcements_active_idx
  on public.announcements (is_active, created_at desc);
alter table public.announcements enable row level security;

-- ────────────────────────────────────────────────────────────
-- 2. Per-user notifications
-- ────────────────────────────────────────────────────────────
create table if not exists public.user_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  title       text not null,
  body        text,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists user_notifications_user_idx
  on public.user_notifications (user_id, created_at desc);
alter table public.user_notifications enable row level security;

drop policy if exists "Users read own notifications" on public.user_notifications;
create policy "Users read own notifications"
  on public.user_notifications for select
  to authenticated using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.user_notifications;
create policy "Users update own notifications"
  on public.user_notifications for update
  to authenticated using (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 3. Helper — add a notification for a user (server / triggers)
-- ────────────────────────────────────────────────────────────
create or replace function public.add_user_notification(
  p_user_id uuid,
  p_title   text,
  p_body    text default null,
  p_link    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_title is null then return; end if;
  insert into public.user_notifications (user_id, title, body, link)
  values (p_user_id, p_title, p_body, p_link);
end;
$$;

revoke all on function public.add_user_notification(uuid, text, text, text) from public;
grant execute on function public.add_user_notification(uuid, text, text, text)
  to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 4. Welcome notification on signup
-- ────────────────────────────────────────────────────────────
create or replace function public.notify_welcome_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_notifications (user_id, title, body, link)
  values (
    new.id,
    'Welcome to AgentForge! 🎉',
    'Your account is ready with 100 free credits. Try our Textile, Jewellery & Productography AI studios — now with Ultra HD results!',
    '/textileprints-to-mockup'
  );
  return new;
exception when others then
  return new; -- never block signup
end;
$$;

drop trigger if exists on_auth_user_welcome on auth.users;
create trigger on_auth_user_welcome
  after insert on auth.users
  for each row execute function public.notify_welcome_new_user();

-- ────────────────────────────────────────────────────────────
-- 5. Verification
-- ────────────────────────────────────────────────────────────
-- SELECT count(*) FROM public.announcements;
-- SELECT user_id, title, is_read, created_at
--   FROM public.user_notifications ORDER BY created_at DESC LIMIT 10;
-- ============================================================
