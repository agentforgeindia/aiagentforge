-- ============================================================
-- 00 — BACKUP SNAPSHOT (run FIRST, before any pending migration)
-- ============================================================
-- Copies everything the pending migrations and the new code can
-- touch into a private schema, so any single table (or a single
-- user's balance) can be put back without restoring the whole
-- database.
--
--   • Adds data only — nothing in `public` or `storage` is changed.
--   • The schema is not exposed through the API (only `public` is),
--     and access is removed from the browser roles as well.
--   • Safe to run twice on different days: change the date in the
--     schema name.
--
-- This is IN ADDITION to a full database backup:
--   Supabase Dashboard → Database → Backups → confirm there is a
--   backup from today (or take one / download a pg_dump) before
--   go-live.
-- ============================================================

create schema if not exists af_backup_20261008;
revoke all on schema af_backup_20261008 from public, anon, authenticated;

-- Money and credits
create table af_backup_20261008.profiles                 as select * from public.profiles;
create table af_backup_20261008.credit_transactions      as select * from public.credit_transactions;
create table af_backup_20261008.team_credit_transactions as select * from public.team_credit_transactions;
create table af_backup_20261008.teams                    as select * from public.teams;
create table af_backup_20261008.payments                 as select * from public.payments;
create table af_backup_20261008.feedback                 as select * from public.feedback;

-- Generations (status / refund flags / image links are changed by the sweeper)
create table af_backup_20261008.generations              as select * from public.generations;

-- Referrals, meetings, creator programme
create table af_backup_20261008.referrals                as select * from public.referrals;
create table af_backup_20261008.meetings                 as select * from public.meetings;
create table af_backup_20261008.candidates               as select * from public.candidates;
create table af_backup_20261008.content_creator_social   as select * from public.content_creator_social;
create table af_backup_20261008.referral_earnings        as select * from public.referral_earnings;
create table af_backup_20261008.influencer_withdrawals   as select * from public.influencer_withdrawals;

-- The rules themselves, as they are right now (for a rollback by hand)
create table af_backup_20261008.policies as
  select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
   where schemaname in ('public', 'storage');

create table af_backup_20261008.storage_buckets as
  select id, name, public, file_size_limit, allowed_mime_types from storage.buckets;

create table af_backup_20261008.function_defs as
  select p.proname, pg_get_function_identity_arguments(p.oid) as args, pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prokind = 'f';

revoke all on all tables in schema af_backup_20261008 from public, anon, authenticated;

-- Check (should list 16 tables with their row counts):
--   select relname, n_live_tup from pg_stat_user_tables where schemaname = 'af_backup_20261008' order by 1;
--
-- Put ONE user's balance back (example):
--   update public.profiles p set credits = b.credits
--     from af_backup_20261008.profiles b
--    where b.id = p.id and p.id = '<user uuid>';
--
-- When everything has been stable for a few weeks the snapshot can be
-- removed from the dashboard (Table editor → schema af_backup_20261008).
