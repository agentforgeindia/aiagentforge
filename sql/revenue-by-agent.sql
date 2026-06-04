-- ============================================================
-- AgentForge — Revenue Attribution by Agent
-- Run this in Supabase SQL Editor.
-- ============================================================

create or replace function public.revenue_by_agent(
  p_month date default date_trunc('month', current_date)::date
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_m_start date := date_trunc('month', p_month)::date;
  v_m_end   date := (date_trunc('month', p_month) + interval '1 month')::date;
  v_today   date := current_date;
  v_result  jsonb;
begin
  if not (current_user in ('service_role','postgres') or public.has_permission('finance.view') or public.has_permission('*')) then
    raise exception 'revenue_by_agent: permission denied';
  end if;

  -- Attribution: credits consumed per agent × revenue per credit
  -- revenue_per_credit = total_paid_revenue / total_credits_purchased
  with rev_per_credit as (
    select
      case when coalesce(sum(credits_added),0) > 0
           then sum(amount)::numeric / sum(credits_added)
           else 0 end as rpc
    from public.payments where status = 'paid'
  ),
  -- Credits consumed per agent (from credit_transactions reason field)
  agent_credits as (
    select
      case
        when reason like '%jewellery%'       then 'jewellery'
        when reason like '%textile%'         then 'textile'
        when reason like '%productograph%'   then 'productography'
        when reason like '%social%'          then 'social-ads'
        when reason like '%ugc%'             then 'ugc'
        when reason like '%trendforge%'      then 'trendforge'
        when reason like '%election%'        then 'election-campaign'
        else 'other'
      end as agent_slug,
      abs(delta)::bigint as credits_used,
      created_at
    from public.credit_transactions
    where delta < 0
  ),
  by_agent_all as (
    select
      agent_slug,
      sum(credits_used)::bigint                                                as credits_all_time,
      sum(credits_used) filter (where created_at::date >= v_m_start and created_at::date < v_m_end)::bigint as credits_month,
      sum(credits_used) filter (where created_at::date = v_today)::bigint      as credits_today,
      count(*) filter (where created_at::date >= v_m_start and created_at::date < v_m_end)::int as txns_month
    from agent_credits
    group by agent_slug
  ),
  total_credits as (
    select greatest(sum(credits_all_time), 1) as total from by_agent_all
  )
  select jsonb_build_object(
    'month',   v_m_start,
    'agents',  (
      select coalesce(jsonb_agg(jsonb_build_object(
        'agent_slug',     a.agent_slug,
        'credits_today',  coalesce(a.credits_today, 0),
        'credits_month',  coalesce(a.credits_month, 0),
        'credits_total',  coalesce(a.credits_all_time, 0),
        'revenue_month',  round(coalesce(a.credits_month,0) * r.rpc, 2),
        'revenue_total',  round(coalesce(a.credits_all_time,0) * r.rpc, 2),
        'share_pct',      round(coalesce(a.credits_all_time,0) * 100.0 / t.total, 1)
      ) order by a.credits_all_time desc), '[]')
      from by_agent_all a, rev_per_credit r, total_credits t
    ),
    'total_revenue_month', (select coalesce(sum(amount),0) from public.payments where status='paid' and created_at::date >= v_m_start and created_at::date < v_m_end),
    'revenue_per_credit',  (select rpc from rev_per_credit)
  ) into v_result;

  return v_result;
exception when undefined_table or undefined_column then
  return jsonb_build_object('error', 'tables missing');
end;
$$;

revoke all on function public.revenue_by_agent(date) from public;
grant execute on function public.revenue_by_agent(date) to authenticated, service_role;
