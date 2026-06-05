-- Fix: Function Search Path Mutable warnings (Supabase Security Advisor)
-- Run this in the Supabase SQL Editor to patch live functions.

-- handle_new_user (Supabase auth hook — typically auto-generated)
-- set_updated_at (generic trigger — check if it exists in your DB)
-- The 11 functions below are from our SQL files:

ALTER FUNCTION public.posts_touch_updated_at() SET search_path = public;
ALTER FUNCTION public.tasks_touch_updated_at() SET search_path = public;
ALTER FUNCTION public.leads_touch_updated_at() SET search_path = public;
ALTER FUNCTION public.set_referral_code() SET search_path = public;
ALTER FUNCTION public.profiles_block_credit_tampering() SET search_path = public;
ALTER FUNCTION public.trigger_score_lead() SET search_path = public;
ALTER FUNCTION public.notify_on_new_signup() SET search_path = public;
ALTER FUNCTION public.notify_on_new_ticket() SET search_path = public;
ALTER FUNCTION public.notify_on_task_assigned() SET search_path = public;
ALTER FUNCTION public.notify_on_new_lead() SET search_path = public;
ALTER FUNCTION public.notify_on_payment_change() SET search_path = public;
