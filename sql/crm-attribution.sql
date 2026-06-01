-- ============================================================
-- AgentForge CRM — UTM attribution + webhook lead source
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Adds the columns the UTM capture component writes to + the
-- ones the Meta / Google lead webhooks fill in.
--
-- Safe to run multiple times — uses "add column if not exists".
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  profiles  — track where each signup came from
-- ────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists utm_source        text,
  add column if not exists utm_medium        text,
  add column if not exists utm_campaign      text,
  add column if not exists utm_content       text,
  add column if not exists utm_term          text,
  add column if not exists referrer          text,
  add column if not exists landing_path      text,
  add column if not exists first_seen_at     timestamptz;

create index if not exists profiles_utm_source_idx
  on public.profiles (utm_source) where utm_source is not null;
create index if not exists profiles_utm_campaign_idx
  on public.profiles (utm_campaign) where utm_campaign is not null;

-- ────────────────────────────────────────────────────────────
-- 2.  leads — same UTM bag for lead-form ads + webhooks
-- ────────────────────────────────────────────────────────────
alter table public.leads
  add column if not exists utm_source        text,
  add column if not exists utm_medium        text,
  add column if not exists utm_campaign      text,
  add column if not exists utm_content       text,
  add column if not exists utm_term          text,
  add column if not exists external_lead_id  text,    -- e.g. Meta leadgen_id
  add column if not exists raw_payload       jsonb;   -- full webhook body, for debugging

-- One row per Meta/Google lead — block duplicates if the webhook
-- replays.
create unique index if not exists leads_external_id_unique
  on public.leads (external_lead_id) where external_lead_id is not null;

-- ────────────────────────────────────────────────────────────
-- 3.  Verification
-- ────────────────────────────────────────────────────────────
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='profiles' and column_name like 'utm_%';
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='leads' and column_name like 'utm_%';
-- ============================================================
