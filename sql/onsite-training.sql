-- ============================================================
-- AgentForge — On-Site AI Training bookings
-- ============================================================
-- Public visitor books a free on-site visit: the AgentForge team comes
-- to their showroom/factory and trains their staff to generate AI
-- mockups. Creates a row here + a support task (type = 'demo') so the
-- team confirms the date/time on WhatsApp/call.
--
-- Run this WHOLE file in Supabase SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists public.onsite_training_bookings (
  id               uuid primary key default gen_random_uuid(),
  company_name     text not null,
  contact_person   text not null,
  mobile           text not null,
  email            text,
  city             text not null,
  address          text,
  industry_type    text,                 -- Manufacturer | Wholesaler | Boutique | ...
  staff_count      text,                 -- how many staff will attend
  preferred_date   date not null,
  preferred_time   text not null,        -- Morning | Afternoon | Evening
  photo_urls       text[],               -- showroom / product photos uploaded with the booking
  notes            text,
  status           text not null default 'new'
                   check (status in ('new', 'confirmed', 'completed', 'cancelled')),
  task_id          uuid references public.tasks(id) on delete set null,
  created_at       timestamptz not null default now()
);

-- Add newer columns if the table already existed from an earlier run.
alter table public.onsite_training_bookings add column if not exists photo_urls text[];

create index if not exists onsite_training_bookings_date_idx
  on public.onsite_training_bookings (preferred_date, created_at desc);

-- Locked down: only the service role (API routes) can read/write.
alter table public.onsite_training_bookings enable row level security;

-- ============================================================
-- Verify:
--   select company_name, contact_person, mobile, city, preferred_date,
--          preferred_time, status, created_at
--     from public.onsite_training_bookings order by created_at desc limit 20;
-- ============================================================
