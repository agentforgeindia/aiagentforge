-- ============================================================
-- Run this in Supabase SQL Editor if teams.sql ran partially.
-- Fixes: missing updated_at column + schema cache reload.
-- ============================================================

-- 1. Add updated_at if it was skipped (safe to run multiple times)
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Reload PostgREST schema cache (fixes "column not found" errors)
NOTIFY pgrst, 'reload schema';
