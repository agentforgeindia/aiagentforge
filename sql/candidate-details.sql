-- ============================================================
-- AgentForge — Candidate Details + Location (post-pass step)
-- Run this in Supabase SQL Editor.
-- ============================================================

alter table public.candidates
  add column if not exists address          text,
  add column if not exists locality         text,
  add column if not exists landmark         text,
  add column if not exists latitude         numeric(10,6),
  add column if not exists longitude        numeric(10,6),
  add column if not exists distance_km      numeric(8,2),
  add column if not exists details_completed boolean not null default false;

-- Office location (founder can update via Settings if needed).
insert into public.system_settings (key, value, label, category) values
  ('office.lat',   '19.0760', 'Office Latitude',  'company'),
  ('office.lng',   '72.8777', 'Office Longitude', 'company'),
  ('office.label', '"AgentForge HQ"', 'Office Name', 'company')
on conflict (key) do nothing;
