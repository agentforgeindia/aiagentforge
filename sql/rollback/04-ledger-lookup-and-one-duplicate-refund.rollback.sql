-- Rollback for sql/pending/04-ledger-lookup-and-one-duplicate-refund.sql
-- (Run in the Supabase SQL editor — it asks for confirmation because
--  it removes three indexes. No data is touched.)
drop index if exists public.credit_tx_one_duplicate_refund;
drop index if exists public.team_credit_tx_generation_idx;
drop index if exists public.credit_tx_generation_idx;
