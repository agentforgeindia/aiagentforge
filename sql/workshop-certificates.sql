-- ============================================================
-- Workshop certificate download log
-- Run this in Supabase SQL Editor (production).
-- ============================================================
-- Stores who downloaded a workshop certificate (name, email,
-- chosen workshop date). One row per download click.
-- ============================================================

create table if not exists public.workshop_certificates (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  email             text not null,
  certificate_date  text not null,
  created_at        timestamptz not null default now()
);

create index if not exists workshop_certificates_email_idx
  on public.workshop_certificates (email);

create index if not exists workshop_certificates_created_idx
  on public.workshop_certificates (created_at desc);

-- RLS on; only the server (service_role) writes/reads.
alter table public.workshop_certificates enable row level security;

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- SELECT name, email, certificate_date, created_at
--   FROM public.workshop_certificates
--   ORDER BY created_at DESC;
-- ============================================================
