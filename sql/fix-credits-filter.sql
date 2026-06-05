-- ============================================================
-- AgentForge — Fix "abs is not an aggregate function" error
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Bug: abs(sum(delta)) filter (...)  — FILTER attached to abs().
-- Fix: abs(sum(delta) filter (...))  — FILTER attached to sum().
-- ============================================================

create or replace function public.credits_overview_metrics()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today   date := current_date;
  v_w_start date := current_date - 6;
  v_m_start date := date_trunc('month', current_date)::date;
  v_result  jsonb;
begin
  if not (current_user in ('service_role','postgres') or public.has_permission('credits.view') or public.has_permission('*')) then
    raise exception 'credits_overview_metrics: permission denied';
  end if;

  with balances as (
    select coalesce(sum(credits),0)::bigint as total_in_circulation,
           count(*)::int as total_users_with_credits,
           max(credits)::bigint as highest_balance
    from public.profiles where credits > 0
  ),
  purchased as (
    select
      coalesce(sum(credits_added),0)::bigint                                               as total_purchased,
      coalesce(sum(credits_added) filter (where created_at::date = v_today),0)::bigint     as purchased_today,
      coalesce(sum(credits_added) filter (where created_at::date >= v_w_start),0)::bigint  as purchased_week,
      coalesce(sum(credits_added) filter (where created_at::date >= v_m_start),0)::bigint  as purchased_month
    from public.payments where status = 'paid'
  ),
  consumed as (
    select
      coalesce(abs(sum(delta) filter (where delta < 0)),0)::bigint                                        as total_consumed,
      coalesce(abs(sum(delta) filter (where delta < 0 and created_at::date = v_today)),0)::bigint         as consumed_today,
      coalesce(abs(sum(delta) filter (where delta < 0 and created_at::date >= v_w_start)),0)::bigint      as consumed_week,
      coalesce(abs(sum(delta) filter (where delta < 0 and created_at::date >= v_m_start)),0)::bigint      as consumed_month,
      coalesce(sum(delta) filter (where delta > 0 and reason like 'refund%'),0)::bigint                   as total_refunded,
      coalesce(sum(delta) filter (where delta > 0 and reason like 'manual%'),0)::bigint                   as total_manual_added
    from public.credit_transactions
  ),
  top_consumers as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'user_id', x.user_id, 'email', p.email, 'full_name', p.full_name,
      'plan', p.plan, 'balance', p.credits, 'consumed', x.consumed
    ) order by x.consumed desc), '[]'::jsonb) as data
    from (
      select user_id, abs(sum(delta))::bigint as consumed
      from public.credit_transactions where delta < 0
      group by user_id order by consumed desc limit 10
    ) x
    left join public.profiles p on p.id = x.user_id
  ),
  recent_txns as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', t.id, 'user_id', t.user_id, 'email', p.email, 'delta', t.delta,
      'reason', t.reason, 'balance_after', t.balance_after, 'created_at', t.created_at
    ) order by t.created_at desc), '[]'::jsonb) as data
    from (
      select id, user_id, delta, reason, balance_after, created_at
      from public.credit_transactions order by created_at desc limit 30
    ) t
    left join public.profiles p on p.id = t.user_id
  )
  select jsonb_build_object(
    'balances', row_to_json(b)::jsonb,
    'purchased', row_to_json(pu)::jsonb,
    'consumed', row_to_json(c)::jsonb,
    'top_consumers', tc.data,
    'recent_txns', rt.data
  ) into v_result
  from balances b, purchased pu, consumed c, top_consumers tc, recent_txns rt;

  return v_result;
exception when undefined_table or undefined_column then
  return jsonb_build_object('error', 'required tables missing');
end;
$$;

revoke all on function public.credits_overview_metrics() from public;
grant execute on function public.credits_overview_metrics() to authenticated, service_role;

-- ── Fix the same FILTER bug in ai_operations_metrics credits ──
-- (the credits sub-block used abs(sum(delta)) filter too)
create or replace function public.ai_operations_metrics()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today   date := current_date;
  v_w_start date := current_date - 6;
  v_m_start date := date_trunc('month', current_date)::date;
  v_result  jsonb;
  v_credits jsonb := jsonb_build_object('total_consumed',0,'consumed_today',0,'consumed_week',0,'consumed_month',0);
begin
  if not (current_user in ('service_role','postgres') or public.has_permission('ai_ops.view') or public.has_permission('*')) then
    raise exception 'ai_operations_metrics: permission denied';
  end if;

  with g as (
    select coalesce(agent_type, 'other') as agent_slug, status, created_at from public.generations
  ),
  totals as (
    select
      count(*)::int                                                          as total_all_time,
      count(*) filter (where created_at::date = v_today)::int               as total_today,
      count(*) filter (where created_at::date >= v_w_start)::int            as total_week,
      count(*) filter (where created_at::date >= v_m_start)::int            as total_month,
      count(*) filter (where status='failed')::int                          as failed_all_time,
      count(*) filter (where status='failed' and created_at::date = v_today)::int as failed_today,
      count(*) filter (where status='pending')::int                         as queued_now,
      count(*) filter (where status='completed')::int                       as completed_all_time
    from g
  ),
  by_agent as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'agent_slug', agent_slug, 'total', total, 'completed', completed,
      'failed', failed, 'today', today,
      'failure_pct', case when total=0 then 0 else round(failed*100.0/total,1) end
    ) order by total desc), '[]'::jsonb) as data
    from (
      select agent_slug,
        count(*)::int                                          as total,
        count(*) filter (where status='completed')::int        as completed,
        count(*) filter (where status='failed')::int           as failed,
        count(*) filter (where created_at::date = v_today)::int as today
      from g group by agent_slug
    ) x
  ),
  recent_fails as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'agent_slug', coalesce(agent_type,'other'), 'user_id', user_id, 'created_at', created_at
    ) order by created_at desc), '[]'::jsonb) as data
    from (select id, agent_type, user_id, created_at from public.generations
          where status='failed' and created_at::date >= current_date-7
          order by created_at desc limit 20) g2
  ),
  daily as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'd', to_char(days.dd,'YYYY-MM-DD'), 'total', coalesce(cnt,0), 'failed', coalesce(failed,0)
    ) order by days.dd), '[]'::jsonb) as data
    from (select d::date as dd from generate_series((v_today-29)::timestamp, v_today::timestamp, interval '1 day') d) days
    left join (
      select created_at::date as d, count(*)::int as cnt, count(*) filter (where status='failed')::int as failed
      from public.generations where created_at::date >= v_today-29 group by 1
    ) x on x.d = days.dd
  )
  select jsonb_build_object('totals', row_to_json(t)::jsonb, 'by_agent', a.data,
    'credits', v_credits, 'recent_fails', f.data, 'daily', d.data)
  into v_result from totals t, by_agent a, recent_fails f, daily d;

  begin
    select jsonb_build_object(
      'total_consumed', coalesce(abs(sum(delta) filter (where delta<0)),0),
      'consumed_today', coalesce(abs(sum(delta) filter (where delta<0 and created_at::date=v_today)),0),
      'consumed_week',  coalesce(abs(sum(delta) filter (where delta<0 and created_at::date>=v_w_start)),0),
      'consumed_month', coalesce(abs(sum(delta) filter (where delta<0 and created_at::date>=v_m_start)),0)
    ) into v_credits from public.credit_transactions;
    v_result := jsonb_set(v_result, '{credits}', v_credits);
  exception when undefined_table then null;
  end;

  return v_result;
end;
$$;

revoke all on function public.ai_operations_metrics() from public;
grant execute on function public.ai_operations_metrics() to authenticated, service_role;
