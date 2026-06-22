-- Workshop preference survey — visitors' preferred day/time for the next batch.
-- Run in Supabase SQL Editor.

create table if not exists public.workshop_survey (
  id             uuid primary key default gen_random_uuid(),
  preferred_day  text,
  preferred_time text,
  name           text,
  phone          text,
  created_at     timestamptz not null default now()
);

alter table public.workshop_survey enable row level security;

-- Quick tally:
-- SELECT preferred_day, preferred_time, count(*) FROM public.workshop_survey
--   GROUP BY 1,2 ORDER BY count(*) DESC;
