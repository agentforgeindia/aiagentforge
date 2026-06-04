-- ============================================================
-- AgentForge — War Room Upgrade (Phase 3+)
-- Extends dashboard_metrics() with AI, Finance, Support data.
-- Run this in Supabase SQL Editor.
-- ============================================================

create or replace function public.dashboard_metrics(
  p_actor_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today    date := current_date;
  v_yest     date := current_date - 1;
  v_w_start  date := current_date - 7;
  v_m_start  date := date_trunc('month', current_date)::date;

  -- Revenue
  v_rev_today     numeric; v_rev_yest    numeric;
  v_rev_week      numeric; v_rev_month   numeric; v_rev_lifetime numeric;

  -- Customers
  v_signups_today int; v_signups_week int;
  v_new_payers    int; v_paying       int;
  v_active_subs   int; v_expiring_7d  int; v_expired_subs int;

  -- Pipeline
  v_open_leads    int; v_hot_leads    int;
  v_open_tasks    int; v_my_open_tasks int; v_overdue_tasks int;

  -- Credits
  v_used_today    bigint; v_used_week bigint; v_used_month bigint;

  -- AI Operations
  v_gens_today    int; v_gens_month   int;
  v_failed_today  int; v_queued_now   int;

  -- Finance
  v_expenses_month  numeric; v_net_profit_month numeric;

  -- Support
  v_open_tickets    int; v_urgent_tickets int;

  -- JSON blobs
  v_plans         jsonb; v_lead_sources  jsonb;
  v_daily_revenue jsonb; v_health        jsonb;
  v_alerts        jsonb;
begin
  if not (
    public.has_permission('dashboard.view')
    or public.has_permission('*')
  ) then
    raise exception 'dashboard_metrics: caller lacks dashboard.view permission';
  end if;

  -- ── Revenue ──────────────────────────────────────────────────
  select coalesce(sum(amount),0) into v_rev_today    from public.payments where status='paid' and created_at::date = v_today;
  select coalesce(sum(amount),0) into v_rev_yest     from public.payments where status='paid' and created_at::date = v_yest;
  select coalesce(sum(amount),0) into v_rev_week     from public.payments where status='paid' and created_at::date >= v_w_start;
  select coalesce(sum(amount),0) into v_rev_month    from public.payments where status='paid' and created_at::date >= v_m_start;
  select coalesce(sum(amount),0) into v_rev_lifetime from public.payments where status='paid';

  -- ── Customers ────────────────────────────────────────────────
  select count(*) into v_signups_today from public.profiles where created_at::date = v_today;
  select count(*) into v_signups_week  from public.profiles where created_at::date >= v_w_start;

  select count(*) into v_new_payers
    from public.payments where status='paid' and created_at::date = v_today;

  select count(*) into v_paying
    from public.profiles where plan is not null and plan <> 'free' and plan <> '';

  select count(*) into v_active_subs
    from public.profiles where plan_expires_at > now();

  select count(*) into v_expiring_7d
    from public.profiles
    where plan_expires_at > now() and plan_expires_at <= now() + interval '7 days';

  select count(*) into v_expired_subs
    from public.profiles where plan_expires_at < now() and plan is not null and plan <> '';

  -- ── Pipeline ─────────────────────────────────────────────────
  select count(*) into v_open_leads
    from public.leads where status not in ('converted','lost','closed');

  select count(*) into v_hot_leads
    from public.leads where status in ('qualified','demo','trial');

  select count(*) into v_open_tasks    from public.tasks where status not in ('done','cancelled');
  select count(*) into v_overdue_tasks from public.tasks where status not in ('done','cancelled') and due_at < now();

  begin
    if p_actor_email is not null then
      select count(*) into v_my_open_tasks
        from public.tasks
        where status not in ('done','cancelled')
          and lower(assigned_to_email) = lower(p_actor_email);
    else
      v_my_open_tasks := 0;
    end if;
  exception when others then
    v_my_open_tasks := 0;
  end;

  -- ── Credits ──────────────────────────────────────────────────
  select coalesce(sum(-delta),0) into v_used_today from public.credit_transactions where delta<0 and created_at::date = v_today;
  select coalesce(sum(-delta),0) into v_used_week  from public.credit_transactions where delta<0 and created_at::date >= v_w_start;
  select coalesce(sum(-delta),0) into v_used_month from public.credit_transactions where delta<0 and created_at::date >= v_m_start;

  -- ── AI Operations ────────────────────────────────────────────
  begin
    select
      count(*) filter (where created_at::date = v_today)::int,
      count(*) filter (where created_at::date >= v_m_start)::int,
      count(*) filter (where status='failed' and created_at::date = v_today)::int,
      count(*) filter (where status='pending')::int
    into v_gens_today, v_gens_month, v_failed_today, v_queued_now
    from public.generations;
  exception when undefined_table then
    v_gens_today:=0; v_gens_month:=0; v_failed_today:=0; v_queued_now:=0;
  end;

  -- ── Finance ──────────────────────────────────────────────────
  begin
    select coalesce(sum(amount_inr),0) into v_expenses_month
      from public.finance_expenses where expense_date >= v_m_start;
  exception when undefined_table then
    v_expenses_month := 0;
  end;
  v_net_profit_month := v_rev_month - v_expenses_month;

  -- ── Support ──────────────────────────────────────────────────
  begin
    select
      count(*) filter (where status in ('open','in_progress'))::int,
      count(*) filter (where priority='urgent' and status in ('open','in_progress'))::int
    into v_open_tickets, v_urgent_tickets
    from public.support_tickets;
  exception when undefined_table then
    v_open_tickets:=0; v_urgent_tickets:=0;
  end;

  -- ── Plan distribution ────────────────────────────────────────
  select coalesce(jsonb_agg(jsonb_build_object('plan',plan,'count',n) order by n desc),'[]'::jsonb)
    into v_plans
    from (select coalesce(plan,'Free') as plan, count(*) as n from public.profiles group by 1) p;

  -- ── Lead sources ─────────────────────────────────────────────
  select coalesce(jsonb_agg(jsonb_build_object('source',source,'count',n) order by n desc),'[]'::jsonb)
    into v_lead_sources
    from (select source, count(*) as n from public.leads group by source) s;

  -- ── Daily revenue (30 days, timestamp-safe) ──────────────────
  with days as (
    select d::date as dt
    from generate_series((v_today-29)::timestamp, v_today::timestamp, interval '1 day') d
  ),
  rev as (
    select created_at::date as d, sum(amount) as amount
      from public.payments where status='paid' and created_at::date >= v_today-29
      group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object('d',to_char(days.dt,'YYYY-MM-DD'),'amount',coalesce(rev.amount,0)) order by days.dt),'[]'::jsonb)
    into v_daily_revenue
    from days left join rev on rev.d = days.dt;

  -- ── Customer health ──────────────────────────────────────────
  begin
    select coalesce(jsonb_agg(jsonb_build_object('status',health_status,'count',cnt)),'[]'::jsonb)
      into v_health
      from (select health_status, count(*) as cnt from public.profiles where health_status is not null group by 1) h;
  exception when undefined_column then
    v_health := '[]'::jsonb;
  end;

  -- ── Alerts ───────────────────────────────────────────────────
  v_alerts := '[]'::jsonb;

  if v_urgent_tickets > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'kind','support','severity','critical',
      'message', v_urgent_tickets || ' urgent support ticket(s) open',
      'target','/admin/support-center'));
  end if;

  if v_failed_today > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'kind','ai','severity','warning',
      'message', v_failed_today || ' AI generation(s) failed today',
      'target','/admin/ai-operations'));
  end if;

  if v_expiring_7d > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'kind','subscription','severity','warning',
      'message', v_expiring_7d || ' subscription(s) expire in 7 days',
      'target','/admin/subscriptions?view=expiring'));
  end if;

  if v_expired_subs > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'kind','subscription','severity','critical',
      'message', v_expired_subs || ' subscription(s) already expired',
      'target','/admin/subscriptions?view=expired'));
  end if;

  if v_overdue_tasks > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'kind','task','severity','warning',
      'message', v_overdue_tasks || ' task(s) are overdue',
      'target','/admin/tasks?view=overdue'));
  end if;

  if v_hot_leads > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'kind','lead','severity','info',
      'message', v_hot_leads || ' hot lead(s) need follow-up',
      'target','/admin/leads'));
  end if;

  if v_queued_now > 5 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'kind','ai','severity','warning',
      'message', v_queued_now || ' AI generations stuck in queue',
      'target','/admin/ai-operations'));
  end if;

  return jsonb_build_object(
    'revenue',  jsonb_build_object('today',v_rev_today,'yesterday',v_rev_yest,'this_week',v_rev_week,'this_month',v_rev_month,'lifetime',v_rev_lifetime),
    'counts',   jsonb_build_object(
                  'signups_today',v_signups_today,'signups_week',v_signups_week,
                  'new_payers_today',v_new_payers,'paying_customers',v_paying,
                  'active_subs',v_active_subs,'expiring_7d',v_expiring_7d,'expired_subs',v_expired_subs,
                  'open_leads',v_open_leads,'hot_leads',v_hot_leads,
                  'open_tasks',v_open_tasks,'my_open_tasks',v_my_open_tasks,'overdue_tasks',v_overdue_tasks),
    'credits',  jsonb_build_object('used_today',v_used_today,'used_week',v_used_week,'used_month',v_used_month),
    'ai',       jsonb_build_object('gens_today',v_gens_today,'gens_month',v_gens_month,'failed_today',v_failed_today,'queued_now',v_queued_now),
    'finance',  jsonb_build_object('revenue_month',v_rev_month,'expenses_month',v_expenses_month,'net_profit_month',v_net_profit_month),
    'support',  jsonb_build_object('open_tickets',v_open_tickets,'urgent_tickets',v_urgent_tickets),
    'plans',         v_plans,
    'lead_sources',  v_lead_sources,
    'daily_revenue', v_daily_revenue,
    'health',        v_health,
    'alerts',        v_alerts
  );
end;
$$;

revoke all on function public.dashboard_metrics(text) from public;
grant execute on function public.dashboard_metrics(text) to authenticated, service_role;
