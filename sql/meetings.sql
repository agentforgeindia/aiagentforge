-- ============================================================
-- One-to-one / Zoom meetings — admin scheduled + public booked.
-- Run in Supabase SQL Editor.
-- ============================================================

create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  topic           text not null,
  meeting_type    text,                       -- Demo | Sales Call | Consultation | Workshop | Other
  name            text,
  email           text,
  phone           text,
  start_time      timestamptz not null,
  duration        int  not null default 30,   -- minutes
  zoom_meeting_id text,
  join_url        text,
  start_url       text,
  zoom_password   text,
  status          text not null default 'scheduled',  -- scheduled | completed | cancelled
  source          text not null default 'admin',      -- admin | public
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists meetings_start_idx on public.meetings (start_time desc);
create index if not exists meetings_status_idx on public.meetings (status, start_time);

-- RLS on; the server (service_role) reads/writes via API routes.
alter table public.meetings enable row level security;

-- ============================================================
-- Verification
-- SELECT topic, start_time, status FROM public.meetings ORDER BY start_time DESC;
-- ============================================================
