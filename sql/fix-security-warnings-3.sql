-- ============================================================
-- AgentForge — Security Advisor cleanup (round 3)
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- These two functions are ONLY ever called server-side with the
-- service-role key (payment verify/webhook, and the withdraw API).
-- The browser never calls them, so we remove authenticated/anon/public
-- EXECUTE and keep service_role only — clearing two warnings.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.record_referral_earning(uuid, text, numeric, text)
  FROM authenticated, anon, public;
GRANT  EXECUTE ON FUNCTION public.record_referral_earning(uuid, text, numeric, text)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.request_influencer_withdrawal(uuid, text)
  FROM authenticated, anon, public;
GRANT  EXECUTE ON FUNCTION public.request_influencer_withdrawal(uuid, text)
  TO service_role;
-- ============================================================
-- The remaining "Signed-In Users Can Execute" warnings are EXPECTED and
-- must stay callable by authenticated — the admin panel + RLS depend on
-- them, and each runs its own permission check internally:
--   has_permission, is_admin, current_user_role, current_user_permissions,
--   admin_search, admin_unread_count, list_admin_notifications,
--   founder_command_metrics, log_admin_action, recruitment_overview,
--   free_signups
-- Revoking these would break the dashboard, so they are left as-is.
--
-- "Leaked Password Protection Disabled" is an Auth setting, not SQL:
--   Supabase Dashboard → Authentication → Policies (or Providers) →
--   enable "Leaked password protection".
-- ============================================================
