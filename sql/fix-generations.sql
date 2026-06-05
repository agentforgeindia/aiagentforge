-- ============================================================
-- AgentForge — Fix generation analytics (agent attribution)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Root cause: the generations table never stored which agent ran,
-- and the RPCs referenced columns (agent_slug, agent) that don't
-- exist → "table missing" / empty results.
--
-- This: (1) ensures an agent_type column exists, (2) rewrites the
-- analytics RPCs to use ONLY agent_type with a safe fallback.
-- ============================================================

alter table public.generations
  add column if not exists agent_type text,
  add column if not exists agent_slug text,
  add column if not exists agent      text;

-- ── ai_operations_metrics() — resilient ─────────────────────
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
    select coalesce(agent_type, 'other') as agent_slug, status, created_at
    from public.generations
  ),
  totals as (
    select
      count(*)::int                                                          as total_all_time,
      count(*) filter (where created_at::date = v_today)::int               as total_today,
      count(*) filter (where created_at::date >= v_w_start)::int            as total_week,
      count(*) filter (where created_at::date >= v_m_start)::int            as total_month,
      count(*) filter (where status = 'failed')::int                        as failed_all_time,
      count(*) filter (where status = 'failed' and created_at::date = v_today)::int as failed_today,
      count(*) filter (where status = 'pending')::int                       as queued_now,
      count(*) filter (where status = 'completed')::int                     as completed_all_time
    from g
  ),
  by_agent as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'agent_slug', agent_slug, 'total', total, 'completed', completed,
      'failed', failed, 'today', today,
      'failure_pct', case when total = 0 then 0 else round(failed*100.0/total,1) end
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

  -- Credits consumed (separate, tolerant of a missing table)
  begin
    select jsonb_build_object(
      'total_consumed', coalesce(abs(sum(delta)) filter (where delta<0),0),
      'consumed_today', coalesce(abs(sum(delta)) filter (where delta<0 and created_at::date=v_today),0),
      'consumed_week',  coalesce(abs(sum(delta)) filter (where delta<0 and created_at::date>=v_w_start),0),
      'consumed_month', coalesce(abs(sum(delta)) filter (where delta<0 and created_at::date>=v_m_start),0)
    ) into v_credits from public.credit_transactions;
    v_result := jsonb_set(v_result, '{credits}', v_credits);
  exception when undefined_table then null;
  end;

  return v_result;
end;
$$;

revoke all on function public.ai_operations_metrics() from public;
grant execute on function public.ai_operations_metrics() to authenticated, service_role;

-- ── generation_log() — resilient ────────────────────────────
create or replace function public.generation_log(
  p_limit int default 100, p_agent text default null, p_status text default null
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_rate numeric;
begin
  if not (current_user in ('service_role','postgres') or public.has_permission('ai_ops.view') or public.has_permission('*')) then
    raise exception 'generation_log: permission denied';
  end if;
  begin select coalesce(usd_to_inr_rate,83.5) into v_rate from public.ai_cost_settings where id=1; exception when undefined_table then v_rate:=83.5; end;
  v_rate := coalesce(v_rate, 83.5);

  return (
    select coalesce(jsonb_agg(row), '[]'::jsonb) from (
      select jsonb_build_object(
        'id', g.id, 'agent', coalesce(g.agent_type,'other'), 'user_id', g.user_id,
        'email', p.email, 'status', g.status, 'created_at', g.created_at,
        'cost_usd', coalesce(c.cost_per_generation_usd, 0.04),
        'cost_inr', round(coalesce(c.cost_per_generation_usd, 0.04) * v_rate, 2)
      ) as row
      from public.generations g
      left join public.agent_costs c on c.agent_slug = g.agent_type
      left join public.profiles p on p.id = g.user_id
      where (p_agent is null or coalesce(g.agent_type,'other') = p_agent)
        and (p_status is null or g.status = p_status)
      order by g.created_at desc limit greatest(p_limit,1)
    ) sub
  );
end;
$$;

revoke all on function public.generation_log(int, text, text) from public;
grant execute on function public.generation_log(int, text, text) to authenticated, service_role;
