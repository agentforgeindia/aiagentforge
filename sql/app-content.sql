-- ============================================================
-- App content — banners and offers shown inside the Android app
-- Run this WHOLE file once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- The team manages these from Admin → App Content → Banners & Offers.
--
--   banner → picture slide on the app Home screen
--   offer  → offer ticket on the app Home and Credits screens
--
-- An item is shown to users only when ALL of these are true:
--   is_active = true
--   starts_at is empty or already passed
--   ends_at   is empty or still in the future
--
-- Reads and writes go through the server (service role):
--   GET  /api/app-content         (public, live items only)
--   *    /api/admin/app-content   (admin, needs content.* permission)
-- RLS is on with no policies, so the browser can never touch the
-- table directly.
-- ============================================================

create table if not exists public.app_content (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('banner', 'offer')),
  title       text not null,
  body        text,
  -- offer: short highlight printed on the ticket stub ("20% extra")
  badge       text,
  image_url   text,
  cta_label   text,
  -- "/billing" style path inside the app, or a full https:// link
  link        text,
  -- banner: false = show only the picture (text is already in the artwork)
  show_text   boolean not null default true,
  -- all = everyone, guests = not logged in, members = logged in
  audience    text not null default 'all'
              check (audience in ('all', 'guests', 'members')),
  starts_at   timestamptz,
  ends_at     timestamptz,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists app_content_live_idx
  on public.app_content (kind, is_active, sort_order);

alter table public.app_content enable row level security;

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- select kind, title, is_active, starts_at, ends_at, sort_order
--   from public.app_content order by kind, sort_order;
-- ============================================================
