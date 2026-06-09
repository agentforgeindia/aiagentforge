-- ============================================================
-- AgentForge — Security Advisor cleanup (round 2)
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- Clears the actionable warnings without breaking the app:
--   1. fn_log_candidate_stage — set a fixed search_path.
--   2. free_signups / recruitment_overview — remove anon/public EXECUTE
--      (admin pages call them with a signed-in session, never anon).
--
-- NOTE: the remaining "Signed-In Users Can Execute SECURITY DEFINER"
-- warnings (has_permission, is_admin, current_user_role,
-- current_user_permissions, admin_search, admin_unread_count,
-- founder_command_metrics, list_admin_notifications, etc.) are EXPECTED.
-- These functions must be callable by authenticated users — the app and
-- RLS policies depend on them, and each does its own internal permission
-- check. Revoking EXECUTE from authenticated would break the admin panel,
-- so we intentionally leave those as-is.
-- ============================================================

-- 1. Function search path
ALTER FUNCTION public.fn_log_candidate_stage() SET search_path = public;

-- 2. Remove public / anon execute on these (signed-in only)
REVOKE EXECUTE ON FUNCTION public.free_signups(int, int)      FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.recruitment_overview()      FROM anon, public;

-- Re-affirm the intended grants
GRANT EXECUTE ON FUNCTION public.free_signups(int, int)   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recruitment_overview()  TO authenticated, service_role;
-- ============================================================
