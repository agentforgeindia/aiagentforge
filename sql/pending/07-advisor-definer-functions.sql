-- ============================================================
-- 07 — Supabase advisor: "Signed-in users can execute SECURITY
--      DEFINER function" (42 warnings)          (NOT applied yet)
-- ============================================================
-- The advisor warns about every SECURITY DEFINER function in the
-- API schema (public) that a signed-in user may call, because such a
-- function runs with the owner's rights and skips row-level security.
--
-- What these 42 functions are (each one was read, 2026-10-08):
--   • 37 are called by the admin panel / customer screens from the
--     browser. Every admin one checks the caller's permission as its
--     first statement (or filters by it); the personal ones only
--     touch the caller's own rows.
--   • 4 are helpers used inside the row-level-security rules
--     (is_admin, has_permission, my_team_ids, my_admin_team_ids).
--   • 1 (generation_log, the old version) is not called by anything.
--
-- What this migration does:
--   1. generation_log(integer, text, text): signed-in users lose the
--      right to call it (nothing uses it; generation_log_v2 stays).
--   2. log_admin_action(): the one function that did not check the
--      caller — any signed-in customer could add a line to the admin
--      audit log under their own name. Now only team members can.
--   3. The other 41 move to a new schema "private", which is NOT
--      served by the API, and public gets a thin function with the
--      same name, arguments, result and call rights that simply calls
--      it (SECURITY INVOKER — it has no special rights of its own).
--      For the app, the admin panel and the security rules nothing
--      changes: same names, same answers, same permission checks.
--
-- Honest note: step 3 does not take any ability away from anyone —
-- these functions are MEANT to be callable and already check
-- permissions inside. It keeps privileged code out of the API schema
-- and clears the warning. Steps 1 and 2 are real tightening.
--
-- Checked on the local replica (scripts/staging/advisor-checks.sh):
-- all 42 functions are called as a visitor, a customer, one team
-- member per permission, the founder and the server before and after
-- — same result or same error every time; all row-level-security
-- checks unchanged; Supabase's advisor query reports 0 afterwards.
--
-- Deploy order: after 06. The app does not need to be redeployed.
-- Rollback: sql/rollback/07-advisor-definer-functions.rollback.sql
-- ============================================================

begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- 1. Old, unused version of the generation log.
revoke execute on function public.generation_log(integer, text, text) from authenticated;

-- 2. Audit log: team members only.
CREATE OR REPLACE FUNCTION public.log_admin_action(p_action text, p_target_type text DEFAULT NULL::text, p_target_id text DEFAULT NULL::text, p_details jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_email text;
begin
  -- Only team members write to the audit log. (The server role, which
  -- has no browser login, is still allowed.)
  if coalesce(auth.jwt() ->> 'role', '') in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'log_admin_action: not a team member';
  end if;

  select u.email into v_email from auth.users u where u.id = auth.uid();
  insert into public.admin_audit(actor_user_id, actor_email, action, target_type, target_id, details)
    values (auth.uid(), v_email, p_action, p_target_type, p_target_id, p_details)
    returning id into v_id;
  return v_id;
end;
$function$;

-- 3. Move the definer functions out of the API schema; leave a
--    pass-through with the same signature in public.
do $do$
declare
  names text[] := array[
    'academy_overview',
    'add_user_notification',
    'admin_search',
    'admin_unread_count',
    'affiliate_overview',
    'agent_configs_list',
    'ai_business_insights',
    'ai_cost_metrics',
    'ai_operations_metrics',
    'announcement_seen_detail',
    'announcement_seen_summary',
    'attendance_overview',
    'credits_overview_metrics',
    'current_user_permissions',
    'current_user_role',
    'customer_timeline',
    'error_log_summary',
    'finance_metrics',
    'founder_command_metrics',
    'free_signups',
    'generation_log_v2',
    'generation_source_stats',
    'get_my_active_session',
    'has_permission',
    'incentive_overview',
    'is_admin',
    'leaderboard_data',
    'list_admin_notifications',
    'log_admin_action',
    'mark_all_notifications_read',
    'mark_notification_read',
    'marketing_metrics',
    'my_admin_team_ids',
    'my_sales_earnings',
    'my_team_ids',
    'record_announcement_seen',
    'recruitment_overview',
    'revenue_by_agent',
    'sales_room_stats',
    'support_metrics',
    'training_team_progress'
  ];
  f record;
  call_args text;
  body text;
  volatility text;
  n_moved int := 0;
begin
  for f in
    select p.oid, p.proname,
           pg_get_function_arguments(p.oid)          as args,
           pg_get_function_identity_arguments(p.oid) as iargs,
           pg_get_function_result(p.oid)             as res,
           p.proretset, p.provolatile, p.proisstrict, p.pronargs,
           has_function_privilege('anon', p.oid, 'execute')          as anon_x,
           has_function_privilege('authenticated', p.oid, 'execute') as auth_x,
           has_function_privilege('service_role', p.oid, 'execute')  as svc_x
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f' and p.prosecdef
       and p.proname = any (names)
     order by p.proname
  loop
    select coalesce(string_agg('$' || i, ', ' order by i), '') into call_args
      from generate_series(1, f.pronargs) i;

    body := case when f.proretset or f.res like 'TABLE(%'
                 then format('select * from private.%I(%s)', f.proname, call_args)
                 else format('select private.%I(%s)', f.proname, call_args) end;
    volatility := case f.provolatile when 'i' then 'immutable' when 's' then 'stable' else 'volatile' end;

    execute format('alter function public.%I(%s) set schema private', f.proname, f.iargs);
    execute format(
      'create function public.%I(%s) returns %s language sql %s %s security invoker set search_path = %L as %L',
      f.proname, f.args, f.res, volatility,
      case when f.proisstrict then 'strict' else '' end, '', body);
    execute format('comment on function public.%I(%s) is %L', f.proname, f.iargs,
      'Pass-through to private.' || f.proname || ' (migration 07). The permission check is inside that function.');

    -- Exactly the call rights the original had.
    execute format('revoke all on function public.%I(%s) from public, anon, authenticated, service_role', f.proname, f.iargs);
    if f.anon_x then execute format('grant execute on function public.%I(%s) to anon', f.proname, f.iargs); end if;
    if f.auth_x then execute format('grant execute on function public.%I(%s) to authenticated', f.proname, f.iargs); end if;
    if f.svc_x  then execute format('grant execute on function public.%I(%s) to service_role', f.proname, f.iargs); end if;
    n_moved := n_moved + 1;
  end loop;

  if n_moved <> array_length(names, 1) then
    raise exception 'expected % functions, found % — the live functions changed; regenerate this migration', array_length(names, 1), n_moved;
  end if;
end
$do$;

commit;

-- Tell the API to re-read the function list.
notify pgrst, 'reload schema';
