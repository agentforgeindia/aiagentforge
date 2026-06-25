-- ============================================================
-- Workshop registrations — manual "community joined" flag.
-- Run in the Supabase SQL Editor.
-- ============================================================
-- Admin ticks this once a registrant has joined the WhatsApp
-- community; the admin list then shows a "Community joined" badge.
-- ============================================================

alter table public.workshop_registrations
  add column if not exists community_joined boolean not null default false;
