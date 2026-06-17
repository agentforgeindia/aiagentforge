-- ============================================================
-- Meta Conversions API — event log (admin visibility)
-- Run once in the Supabase SQL Editor.
-- ============================================================
-- Every server-side CAPI event (Purchase / Lead / …) is logged here so
-- the admin can see what was sent to Meta, to whom, the value, and
-- whether Meta accepted it — without leaving the backend.
-- ============================================================

create table if not exists public.meta_capi_events (
  id          uuid primary key default gen_random_uuid(),
  event_name  text not null,            -- Purchase / Lead / ...
  email       text,                     -- plain, for admin readability
  phone       text,
  value       numeric,
  currency    text,
  event_id    text,                     -- dedup id (razorpay payment / lead id)
  ok          boolean not null default false,
  status_code int,
  error       text,                     -- Meta's rejection message, if any
  created_at  timestamptz not null default now()
);

create index if not exists meta_capi_events_created_idx
  on public.meta_capi_events (created_at desc);

-- RLS on; only the server (service role) writes, admin API reads via
-- service role.
alter table public.meta_capi_events enable row level security;

-- Verify:
-- select event_name, email, value, ok, created_at
--   from public.meta_capi_events order by created_at desc limit 20;
