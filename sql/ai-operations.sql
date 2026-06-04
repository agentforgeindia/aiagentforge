-- ============================================================
-- AgentForge — AI Operations Dashboard (Phase 3)
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── Permissions ─────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'ai_ops.view'
   ])), updated_at = now()
 where id in ('founder', 'admin');

-- ── ai_operations_metrics() ─────────────────────────────────
create or replace function public.ai_operations_metrics()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today   date := current_date;
  v_w_start date := current_date - 6;
  v_m_start date := date_trunc('month', current_date)::date;
  v_result  jsonb;
begin
  if not (
    current_user in ('service_role', 'postgres')
    or public.has_permission('ai_ops.view')
    or public.has_permission('*')
  ) then
    raise exception 'ai_operations_metrics: permission denied';
  end if;

  with g as (
    select
      coalesce(agent_type, agent_slug, agent) as agent_slug,
      status,
      created_at
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
      'agent_slug',  agent_slug,
      'total',       total,
      'completed',   completed,
      'failed',      failed,
      'today',       today,
      'failure_pct', case when total = 0 then 0
                          else round(failed * 100.0 / total, 1) end
    ) order by total desc), '[]'::jsonb) as data
    from (
      select
        agent_slug,
        count(*)::int                                          as total,
        count(*) filter (where status = 'completed')::int      as completed,
        count(*) filter (where status = 'failed')::int         as failed,
        count(*) filter (where created_at::date = v_today)::int as today
      from g
      group by agent_slug
    ) x
  ),
  credits_used as (
    select
      coalesce(abs(sum(delta)) filter (where delta < 0), 0)::bigint                                         as total_consumed,
      coalesce(abs(sum(delta)) filter (where delta < 0 and created_at::date = v_today), 0)::bigint          as consumed_today,
      coalesce(abs(sum(delta)) filter (where delta < 0 and created_at::date >= v_w_start), 0)::bigint       as consumed_week,
      coalesce(abs(sum(delta)) filter (where delta < 0 and created_at::date >= v_m_start), 0)::bigint       as consumed_month
    from public.credit_transactions
    where reason not like 'refund%' and reason not like 'manual%'
  ),
  recent_fails as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',         g2.id,
      'agent_slug', coalesce(g2.agent_type, g2.agent_slug, g2.agent),
      'user_id',    g2.user_id,
      'created_at', g2.created_at
    ) order by g2.created_at desc), '[]'::jsonb) as data
    from (
      select id, agent_type, agent_slug, agent, user_id, created_at
      from public.generations
      where status = 'failed'
        and created_at::date >= current_date - 7
      order by created_at desc
      limit 20
    ) g2
  ),
  daily as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'd',      to_char(days.dd, 'YYYY-MM-DD'),
      'total',  coalesce(cnt, 0),
      'failed', coalesce(failed, 0)
    ) order by days.dd), '[]'::jsonb) as data
    from (
      select d::date as dd
      from generate_series(
        (v_today - 29)::timestamp,
        v_today::timestamp,
        interval '1 day'
      ) d
    ) days
    left join (
      select created_at::date as d,
             count(*)::int as cnt,
             count(*) filter (where status = 'failed')::int as failed
        from public.generations
       where created_at::date >= v_today - 29
       group by 1
    ) x on x.d = days.dd
  )
  select jsonb_build_object(
    'totals',       row_to_json(t)::jsonb,
    'by_agent',     a.data,
    'credits',      row_to_json(c)::jsonb,
    'recent_fails', f.data,
    'daily',        d.data
  ) into v_result
  from totals t, by_agent a, credits_used c, recent_fails f, daily d;

  return v_result;
exception
  when undefined_table or undefined_column then
    return jsonb_build_object('error', 'generations or credit_transactions table missing');
end;
$$;

revoke all on function public.ai_operations_metrics() from public;
grant execute on function public.ai_operations_metrics() to authenticated, service_role;
