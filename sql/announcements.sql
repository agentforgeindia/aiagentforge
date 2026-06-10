-- ============================================================
-- User announcements / updates (for the notification bell)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Admin posts updates here; the navbar bell shows them to users.
-- ============================================================

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

-- RLS on; the server (service_role) reads/writes via API routes.
alter table public.announcements enable row level security;

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- SELECT title, is_active, created_at FROM public.announcements ORDER BY created_at DESC;
-- ============================================================
