-- ============================================================
-- 04 — Credit ledger: fast lookup by generation, and at most one
--      "duplicate charge" refund per generation   (NOT applied yet)
-- ============================================================
-- 1. The refund code and the sweeper read the ledger by generation
--    id. Both ledger tables only had an index on (user/team, date);
--    these two indexes keep those reads fast as the ledger grows.
--
-- 2. The sweeper gives back a personal charge that duplicates the
--    real one (reason 'refund:duplicate_charge', see
--    lib/generationRefund.ts). refund_credits() updates the balance
--    and writes the ledger line in ONE transaction, so this unique
--    index makes a second such refund for the same generation fail
--    as a whole — the balance is not touched twice even if two
--    sweeper runs overlap.
--
-- Adds indexes only; no row is changed. Checked on 2026-10-08: the
-- ledger holds no 'refund:duplicate_charge' line yet.
--
-- Deploy order: any time (the code works with or without it).
-- Rollback: sql/rollback/04-ledger-lookup-and-one-duplicate-refund.rollback.sql
-- ============================================================

create index if not exists credit_tx_generation_idx
  on public.credit_transactions (generation_id)
  where generation_id is not null;

create index if not exists team_credit_tx_generation_idx
  on public.team_credit_transactions (generation_id)
  where generation_id is not null;

create unique index if not exists credit_tx_one_duplicate_refund
  on public.credit_transactions (user_id, generation_id)
  where reason = 'refund:duplicate_charge';
