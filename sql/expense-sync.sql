-- ============================================================
-- AgentForge — Auto Expense Sync (Meta Ads, OpenAI, FAL)
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Add sync tracking columns to finance_expenses
alter table public.finance_expenses
  add column if not exists source       text,   -- 'meta_sync','openai_sync','fal_sync','manual'
  add column if not exists external_ref text,   -- provider reference / day key
  add column if not exists is_estimated boolean not null default false;

-- One auto row per provider per day (idempotent re-sync)
create unique index if not exists finance_expenses_source_day_idx
  on public.finance_expenses (source, expense_date)
  where source is not null;
