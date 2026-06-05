-- ============================================================
-- AgentForge — Security Advisor Fixes
-- Run this in Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. FUNCTION SEARCH PATH MUTABLE
--    (Also fixes deduct_credits which showed in warnings)
-- ────────────────────────────────────────────────────────────
ALTER FUNCTION public.posts_touch_updated_at()         SET search_path = public;
ALTER FUNCTION public.tasks_touch_updated_at()         SET search_path = public;
ALTER FUNCTION public.leads_touch_updated_at()         SET search_path = public;
ALTER FUNCTION public.set_referral_code()              SET search_path = public;
ALTER FUNCTION public.profiles_block_credit_tampering() SET search_path = public;
ALTER FUNCTION public.trigger_score_lead()             SET search_path = public;
ALTER FUNCTION public.notify_on_new_signup()           SET search_path = public;
ALTER FUNCTION public.notify_on_new_ticket()           SET search_path = public;
ALTER FUNCTION public.notify_on_task_assigned()        SET search_path = public;
ALTER FUNCTION public.notify_on_new_lead()             SET search_path = public;
ALTER FUNCTION public.notify_on_payment_change()       SET search_path = public;
ALTER FUNCTION public.handle_new_user()                SET search_path = public;
ALTER FUNCTION public.set_updated_at()                 SET search_path = public;

-- ────────────────────────────────────────────────────────────
-- 2. RLS POLICY ALWAYS TRUE — profiles INSERT
--    Fix: user can only insert their own profile row
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 3. ANON CAN EXECUTE SECURITY DEFINER FUNCTIONS
--    All admin/internal functions — revoke from anon
--    (functions already have internal permission checks,
--     but anon shouldn't even be able to call them)
-- ────────────────────────────────────────────────────────────

-- Admin dashboard & metrics
REVOKE EXECUTE ON FUNCTION public.admin_search(text, int)            FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_unread_count()               FROM anon;
REVOKE EXECUTE ON FUNCTION public.affiliate_overview()               FROM anon;
REVOKE EXECUTE ON FUNCTION public.agent_configs_list()               FROM anon;
REVOKE EXECUTE ON FUNCTION public.ai_business_insights()             FROM anon;
REVOKE EXECUTE ON FUNCTION public.ai_cost_metrics()                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.ai_operations_metrics()            FROM anon;
REVOKE EXECUTE ON FUNCTION public.attendance_overview(date)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.caller_funnel(int)                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.caller_report_summary(date)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.credits_overview_metrics()         FROM anon;
REVOKE EXECUTE ON FUNCTION public.customer_health(uuid)              FROM anon;
REVOKE EXECUTE ON FUNCTION public.customer_timeline(uuid, int)       FROM anon;
REVOKE EXECUTE ON FUNCTION public.daily_report_metrics()             FROM anon;
REVOKE EXECUTE ON FUNCTION public.dashboard_metrics(text)            FROM anon;
REVOKE EXECUTE ON FUNCTION public.error_log_summary(int)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.finance_metrics()                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.find_lead_for_profile(uuid)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.founder_command_metrics()          FROM anon;
REVOKE EXECUTE ON FUNCTION public.free_signups(int, int)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.generation_log(int, text, text)    FROM anon;
REVOKE EXECUTE ON FUNCTION public.incentive_overview(date)           FROM anon;
REVOKE EXECUTE ON FUNCTION public.leaderboard_data(date)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_admin_notifications(int)      FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.marketing_metrics()                FROM anon;
REVOKE EXECUTE ON FUNCTION public.motivation_context()               FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_invoice_number()              FROM anon;
REVOKE EXECUTE ON FUNCTION public.ping_head_office(text)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.recruitment_overview()             FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_all_customer_health()      FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_customer_health(uuid)      FROM anon;
REVOKE EXECUTE ON FUNCTION public.revenue_by_agent(date)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.sales_room_stats()                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.score_all_leads()                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.score_lead(uuid)                   FROM anon;
REVOKE EXECUTE ON FUNCTION public.support_metrics()                  FROM anon;

-- Payment & credit functions — anon should NEVER call these
REVOKE EXECUTE ON FUNCTION public.deduct_credits(uuid, bigint, text, text)   FROM anon;
REVOKE EXECUTE ON FUNCTION public.refund_credits(uuid, bigint, text, text)   FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_refund(uuid, numeric, text, boolean, bigint, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.extend_subscription(uuid, int)             FROM anon;

-- These have 2 overloads — revoke both
REVOKE EXECUTE ON FUNCTION public.add_credits_for_payment(uuid, numeric, bigint, text, text, text, text)                                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.add_credits_for_payment(uuid, numeric, bigint, text, text, text, text, text, text, text, text, text, text)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.add_credits_for_payment(uuid, numeric, bigint, text, text, text, text)                                              FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.add_credits_for_payment(uuid, numeric, bigint, text, text, text, text, text, text, text, text, text, text)          FROM authenticated;

-- Notification triggers — internal only
REVOKE EXECUTE ON FUNCTION public.notify_on_new_lead()      FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_signup()    FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_ticket()    FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_payment_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_task_assigned() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_notification(text, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, text, uuid, jsonb, timestamptz, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_error(text, text, text, jsonb, uuid)  FROM anon;
REVOKE EXECUTE ON FUNCTION public.email_on_payment_paid()   FROM anon;
REVOKE EXECUTE ON FUNCTION public.email_on_profile_insert() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()         FROM anon;
REVOKE EXECUTE ON FUNCTION public.trigger_score_lead()      FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_referral(text)    FROM anon;

-- my_sales_earnings — authenticated only, not anon
REVOKE EXECUTE ON FUNCTION public.my_sales_earnings()       FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_active_session()   FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_referral()         FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role()       FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_permissions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(text)      FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin()                FROM anon;
