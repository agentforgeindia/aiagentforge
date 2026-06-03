-- ============================================================
-- AgentForge — Founder War Room (Phase 1.3)
-- ============================================================
-- Single function dashboard_metrics() returning a JSON blob
-- with everything the morning dashboard needs in one trip.
--
-- Keys returned:
--   revenue        — { today, yesterday, this_week, this_month, lifetime }
--   counts         — { signups_today, signups_week, new_payers_today,
--                      paying_customers, active_subs, expiring_7d,
--                      expired_subs, open_leads, hot_leads,
--                      open_tasks, my_open_tasks, overdue_tasks }
--   credits        — { used_today, used_week, used_month }
--   plans          — [{ plan, count }]
--   lead_sources   — [{ source, count }]
--   daily_revenue  — [{ d, amount }]   (last 30 days, oldest first)
--   alerts         — [{ kind, message, target, severity }]
--
-- Permission: dashboard.view
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

  v_rev_today      numeric;
  v_rev_yest       numeric;
  v_rev_week       numeric;
  v_rev_month      numeric;
  v_rev_lifetime   numeric;

  v_signups_today  int;
  v_signups_week   int;
  v_new_payers     int;
  v_paying         int;
  v_active_subs    int;
  v_expiring_7d    int;
  v_expired_subs   int;

  v_open_leads     int;
  v_hot_leads      int;
  v_open_tasks     int;
  v_my_open_tasks  int;
  v_overdue_tasks  int;

  v_used_today     bigint;
  v_used_week      bigint;
  v_used_month     bigint;

  v_plans          jsonb;
  v_lead_sources   jsonb;
  v_daily_revenue  jsonb;
  v_alerts         jsonb;
begin
  -- Permission gate. Founder ('*') always passes.
  if not (
    public.has_permission('dashboard.view')
    or public.has_permission('*')
  ) then
    raise exception 'dashboard_metrics: caller lacks dashboard.view permission';
  end if;

  -- ──────── Revenue buckets ────────
  select coalesce(sum(amount), 0) into v_rev_today
    from public.payments
    where status = 'paid' and created_at::date = v_today;

  select coalesce(sum(amount), 0) into v_rev_yest
    from public.payments
    where status = 'paid' and created_at::date = v_yest;

  select coalesce(sum(amount), 0) into v_rev_week
    from public.payments
    where status = 'paid' and created_at::date >= v_w_start;

  select coalesce(sum(amount), 0) into v_rev_month
    from public.payments
    where status = 'paid' and created_at::date >= v_m_start;

  select coalesce(sum(amount), 0) into v_rev_lifetime
    from public.payments
    where status = 'paid';

  -- ──────── Signups + payer counts ────────
  select count(*) into v_signups_today
    from public.profiles where created_at::date = v_today;

  select count(*) into v_signups_week
    from public.profiles where created_at::date >= v_w_start;

  select count(distinct user_id) into v_new_payers
    from public.payments
    where status = 'paid' and created_at::date = v_today;

  select count(*) into v_paying
    from public.profiles
    where plan is not null and plan <> 'Free';

  select count(*) into v_active_subs
    from public.profiles
    where plan_expires_at is not null
      and plan_expires_at > now();

  select count(*) into v_expiring_7d
    from public.profiles
    where plan_expires_at is not null
      and plan_expires_at > now()
      and plan_expires_at <= now() + interval '7 days';

  select count(*) into v_expired_subs
    from public.profiles
    where plan_expires_at is not null
      and plan_expires_at <= now();

  -- ──────── Pipeline ────────
  select count(*) into v_open_leads
    from public.leads
    where status not in ('converted', 'lost');

  select count(*) into v_hot_leads
    from public.leads
    where status in ('qualified', 'demo', 'trial');

  -- ──────── Tasks ────────
  select count(*) into v_open_tasks
    from public.tasks
    where status in ('pending', 'in_progress');

  if p_actor_email is not null then
    select count(*) into v_my_open_tasks
      from public.tasks
      where status in ('pending', 'in_progress')
        and lower(assigned_to_email) = lower(p_actor_email);
  else
    v_my_open_tasks := 0;
  end if;

  select count(*) into v_overdue_tasks
    from public.tasks
    where status in ('pending', 'in_progress')
      and due_at is not null
      and due_at < now();

  -- ──────── Credit usage ────────
  select coalesce(sum(-delta), 0) into v_used_today
    from public.credit_transactions
    where delta < 0 and created_at::date = v_today;

  select coalesce(sum(-delta), 0) into v_used_week
    from public.credit_transactions
    where delta < 0 and created_at::date >= v_w_start;

  select coalesce(sum(-delta), 0) into v_used_month
    from public.credit_transactions
    where delta < 0 and created_at::date >= v_m_start;

  -- ──────── Plan distribution ────────
  select coalesce(
    jsonb_agg(jsonb_build_object('plan', plan, 'count', n) order by n desc),
    '[]'::jsonb
  )
    into v_plans
    from (
      select coalesce(plan, 'Free') as plan, count(*) as n
        from public.profiles
        group by 1
    ) p;

  -- ──────── Lead source breakdown ────────
  select coalesce(
    jsonb_agg(jsonb_build_object('source', source, 'count', n) order by n desc),
    '[]'::jsonb
  )
    into v_lead_sources
    from (
      select source, count(*) as n
        from public.leads
        group by source
    ) s;

  -- ──────── Daily revenue (last 30 days, 0-filled) ────────
  with days as (
    select generate_series(v_today - 29, v_today, interval '1 day')::date as d
  ),
  rev as (
    select created_at::date as d, sum(amount) as amount
      from public.payments
      where status = 'paid'
        and created_at::date >= v_today - 29
      group by 1
  )
  select coalesce(
    jsonb_agg(jsonb_build_object('d', to_char(days.d, 'YYYY-MM-DD'), 'amount', coalesce(rev.amount, 0)) order by days.d),
    '[]'::jsonb
  )
    into v_daily_revenue
    from days
    left join rev using (d);

  -- ──────── Alerts ────────
  -- Compose a small bag of things the founder should look at first.
  v_alerts := '[]'::jsonb;

  if v_expiring_7d > 0 then
    v_alerts := v_alerts || jsonb_build_array(
      jsonb_build_object(
        'kind',     'subscription',
        'severity', 'warning',
        'message',  v_expiring_7d || ' subscription(s) expire in the next 7 days',
        'target',   '/admin/subscriptions?view=expiring'
      )
    );
  end if;

  if v_expired_subs > 0 then
    v_alerts := v_alerts || jsonb_build_array(
      jsonb_build_object(
        'kind',     'subscription',
        'severity', 'critical',
        'message',  v_expired_subs || ' subscription(s) already expired',
        'target',   '/admin/subscriptions?view=expired'
      )
    );
  end if;

  if v_overdue_tasks > 0 then
    v_alerts := v_alerts || jsonb_build_array(
      jsonb_build_object(
        'kind',     'task',
        'severity', 'warning',
        'message',  v_overdue_tasks || ' task(s) are overdue',
        'target',   '/admin/tasks?view=overdue'
      )
    );
  end if;

  if v_hot_leads > 0 then
    v_alerts := v_alerts || jsonb_build_array(
      jsonb_build_object(
        'kind',     'lead',
        'severity', 'info',
        'message',  v_hot_leads || ' hot lead(s) in qualified / demo / trial',
        'target',   '/admin/leads'
      )
    );
  end if;

  return jsonb_build_object(
    'revenue', jsonb_build_object(
      'today',     v_rev_today,
      'yesterday', v_rev_yest,
      'this_week', v_rev_week,
      'this_month',v_rev_month,
      'lifetime',  v_rev_lifetime
    ),
    'counts', jsonb_build_object(
      'signups_today',    v_signups_today,
      'signups_week',     v_signups_week,
      'new_payers_today', v_new_payers,
      'paying_customers', v_paying,
      'active_subs',      v_active_subs,
      'expiring_7d',      v_expiring_7d,
      'expired_subs',     v_expired_subs,
      'open_leads',       v_open_leads,
      'hot_leads',        v_hot_leads,
      'open_tasks',       v_open_tasks,
      'my_open_tasks',    v_my_open_tasks,
      'overdue_tasks',    v_overdue_tasks
    ),
    'credits', jsonb_build_object(
      'used_today', v_used_today,
      'used_week',  v_used_week,
      'used_month', v_used_month
    ),
    'plans',         v_plans,
    'lead_sources',  v_lead_sources,
    'daily_revenue', v_daily_revenue,
    'alerts',        v_alerts
  );
end;
$$;

revoke all on function public.dashboard_metrics(text) from public;
grant execute on function public.dashboard_metrics(text) to authenticated, service_role;

-- ──────────────────────────────────────────────────────────
-- Add dashboard.view permission to founder/admin/accounts
-- ──────────────────────────────────────────────────────────
update public.admin_roles
   set permissions = array(
     select distinct unnest(permissions || ARRAY['dashboard.view'])
   ),
   updated_at = now()
 where id in ('admin', 'accounts');
-- Founder already has '*' wildcard.

-- ──────────────────────────────────────────────────────────
-- Verification (run as founder):
--   select public.dashboard_metrics(auth.jwt() ->> 'email');
-- ============================================================
