-- ============================================================
-- 02 — Creator earnings and payouts are private   (NOT applied yet)
-- ============================================================
-- Tightens who may read public.influencer_withdrawals and
-- public.referral_earnings directly.
--
-- After this migration only the team can read them directly (the
-- same permissions as the admin screens). Creators see their own
-- numbers through /api/careers/influencer/dashboard, which checks
-- their signed session; the server (service role) is not affected.
--
-- Deploy order: AFTER the new code is live — the old
-- /careers/referral page read referral_earnings from the browser and
-- would show "No earnings found" once this is applied.
-- Rollback: sql/rollback/02-creator-tables-private.rollback.sql
-- ============================================================

alter policy iw_public_read on public.influencer_withdrawals
  to authenticated
  using (
    public.has_permission('finance.view')
    or public.has_permission('affiliates.view')
    or public.has_permission('*')
  );
alter policy iw_public_read on public.influencer_withdrawals rename to iw_team_read;

alter policy re_public_read on public.referral_earnings
  to authenticated
  using (
    public.has_permission('finance.view')
    or public.has_permission('affiliates.view')
    or public.has_permission('marketing.view')
    or public.has_permission('hr.view')
    or public.has_permission('*')
  );
alter policy re_public_read on public.referral_earnings rename to re_team_read;
