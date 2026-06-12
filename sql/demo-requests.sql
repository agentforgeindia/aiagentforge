-- ============================================================
-- AgentForge — "Book a Customize Demo" requests
-- ============================================================
-- A public visitor submits a demo request (design + agent +
-- desired output + WhatsApp number). This creates:
--   1. a row here (the raw request + status)
--   2. a support task (type = 'demo')
-- When the team finishes & sends the demo, they "Mark demo sent"
-- in admin → status becomes 'demo_sent' and the WhatsApp number
-- is pushed into the leads pipeline for follow-up.
--
-- Run this WHOLE file in Supabase SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists public.demo_requests (
  id           uuid primary key default gen_random_uuid(),
  agent        text not null,
  output_desc  text,
  output_size  text,
  quality      text,
  device       text,                 -- 'Mobile' | 'Computer'
  whatsapp     text not null,
  design_url   text,
  logo_url     text,
  status       text not null default 'new'
               check (status in ('new', 'demo_sent', 'lead_created')),
  task_id      uuid references public.tasks(id)  on delete set null,
  lead_id      uuid references public.leads(id)  on delete set null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Add the device column if the table already existed from an earlier run.
alter table public.demo_requests add column if not exists device text;

create index if not exists demo_requests_status_idx
  on public.demo_requests (status, created_at desc);

-- Locked down: only the service role (admin API) can read/write.
-- The public submit endpoint and the admin endpoints both use the
-- service-role key, so no anon/authenticated policies are needed.
alter table public.demo_requests enable row level security;

-- ============================================================
-- Verify:
--   select id, agent, whatsapp, status, created_at
--     from public.demo_requests order by created_at desc limit 20;
-- ============================================================
