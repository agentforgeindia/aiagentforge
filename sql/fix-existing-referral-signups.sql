-- fix-existing-referral-signups.sql
-- ============================================================
-- Run this ONCE in Supabase SQL Editor.
--
-- Does two things:
-- 1. Syncs influencer referral codes to profiles.referral_code
--    so process_referral() works for future signups.
-- 2. Back-fills referred_by for signups that happened before
--    the fix was deployed (where referred_by is still NULL
--    but the profile was created via a referral cookie/utm).
-- ============================================================

-- STEP 1: Sync influencer codes to profiles
UPDATE public.profiles p
SET    referral_code = ccs.referral_code
FROM   public.content_creator_social ccs
JOIN   public.candidates c ON c.id = ccs.candidate_id
WHERE  p.email = c.email
  AND  ccs.referral_status = 'active'
  AND  ccs.referral_code IS NOT NULL
  AND  (p.referral_code IS NULL OR p.referral_code <> ccs.referral_code);

-- ============================================================
-- STEP 2: Manual back-fill for the specific signup you tested.
-- Replace 'EMAIL_OF_NEW_USER' with the actual email of the
-- person who signed up via Gurpreet's referral link.
-- ============================================================
-- UPDATE public.profiles
-- SET referred_by = 'AFGURPR7J8G'
-- WHERE email = 'EMAIL_OF_NEW_USER'
--   AND (referred_by IS NULL OR referred_by = '');

-- ============================================================
-- VERIFY — shows all influencers and their signup counts
-- ============================================================
SELECT
  c.name                            AS influencer,
  ccs.referral_code,
  p_inf.referral_code               AS profile_code,
  CASE WHEN p_inf.referral_code = ccs.referral_code THEN '✅' ELSE '❌ not synced' END AS sync_status,
  COUNT(p_ref.id)                   AS signups_count
FROM public.content_creator_social ccs
JOIN public.candidates   c     ON c.id    = ccs.candidate_id
LEFT JOIN public.profiles p_inf ON p_inf.email = c.email
LEFT JOIN public.profiles p_ref ON p_ref.referred_by = ccs.referral_code
WHERE ccs.referral_status = 'active'
GROUP BY c.name, ccs.referral_code, p_inf.referral_code;
