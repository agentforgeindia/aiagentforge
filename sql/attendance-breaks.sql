-- ============================================================
-- AgentForge — Attendance: breaks + idle auto-logout + reason
-- Run this in Supabase SQL Editor.
-- ============================================================

alter table public.attendance_logs
  add column if not exists break_mins     int     not null default 0,
  add column if not exists auto_logout     boolean not null default false,
  add column if not exists relogin_reason  text;

-- Break log (lunch / tea / other).
create table if not exists public.attendance_breaks (
  id          uuid primary key default gen_random_uuid(),
  log_id      uuid references public.attendance_logs(id) on delete cascade,
  member_email text not null,
  break_type  text not null check (break_type in ('lunch','tea','other')),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  mins        int generated always as (
                case when ended_at is not null then extract(epoch from (ended_at - started_at))/60 else null end
              ) stored,
  date        date not null default current_date
);
create index if not exists att_breaks_idx on public.attendance_breaks (member_email, date desc);

alter table public.attendance_breaks enable row level security;
drop policy if exists "breaks own"   on public.attendance_breaks;
drop policy if exists "breaks admin" on public.attendance_breaks;
create policy "breaks own"
  on public.attendance_breaks for all to authenticated
  using (lower(member_email) = lower((select email from auth.users where id = auth.uid())))
  with check (lower(member_email) = lower((select email from auth.users where id = auth.uid())));
create policy "breaks admin"
  on public.attendance_breaks for select to authenticated
  using (public.has_permission('team.view') or public.has_permission('*'));
