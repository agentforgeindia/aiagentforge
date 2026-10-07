-- Rollback for sql/pending/02-creator-tables-private.sql
-- Puts the two read rules back exactly as they were on 2026-10-07.
alter policy iw_team_read on public.influencer_withdrawals rename to iw_public_read;
alter policy iw_public_read on public.influencer_withdrawals
  to public
  using (true);

alter policy re_team_read on public.referral_earnings rename to re_public_read;
alter policy re_public_read on public.referral_earnings
  to public
  using (true);
