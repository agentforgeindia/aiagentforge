-- sync-influencer-referral-codes.sql
-- ============================================================
-- Syncs content_creator_social.referral_code → profiles.referral_code
-- for all active influencers.
--
-- WHY: process_referral() looks up profiles.referral_code when
-- a new user signs up via ?ref=CODE. Without this sync, influencer
-- referral codes (e.g. AFGURPR7J8G) are never found → signups
-- are not attributed → dashboard shows 0.
--
-- Run once in Supabase SQL Editor. Safe to re-run (idempotent).
-- ============================================================

UPDATE public.profiles p
SET    referral_code = ccs.referral_code
FROM   public.content_creator_social ccs
JOIN   public.candidates c ON c.id = ccs.candidate_id
WHERE  p.email = c.email
  AND  ccs.referral_status = 'active'
  AND  ccs.referral_code IS NOT NULL
  AND  (p.referral_code IS NULL OR p.referral_code <> ccs.referral_code);

-- Verify result
SELECT
  c.name,
  c.email,
  ccs.referral_code  AS influencer_code,
  p.referral_code    AS profile_code,
  CASE WHEN p.referral_code = ccs.referral_code THEN '✅ synced' ELSE '❌ mismatch' END AS status
FROM public.content_creator_social ccs
JOIN public.candidates c  ON c.id  = ccs.candidate_id
LEFT JOIN public.profiles p ON p.email = c.email
WHERE ccs.referral_status = 'active';
