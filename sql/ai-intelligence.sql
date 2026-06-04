-- ============================================================
-- AgentForge — AI Business Intelligence
-- Run this in Supabase SQL Editor.
-- ============================================================

create or replace function public.ai_business_insights()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today    date := current_date;
  v_m_start  date := date_trunc('month', current_date)::date;
  v_lm_start date := (date_trunc('month', current_date) - interval '1 month')::date;
  v_lm_end   date := date_trunc('month', current_date)::date;
  v_w_start  date := current_date - 7;
  v_insights jsonb := '[]'::jsonb;
  v_row      record;
begin
  if not (current_user in ('service_role','postgres') or public.has_permission('dashboard.view') or public.has_permission('*')) then
    raise exception 'ai_business_insights: permission denied';
  end if;

  -- ── 1. Revenue MoM change ────────────────────────────────────
  declare
    v_rev_this  numeric;
    v_rev_last  numeric;
    v_pct       numeric;
  begin
    select coalesce(sum(amount),0) into v_rev_this from public.payments where status='paid' and created_at::date >= v_m_start;
    select coalesce(sum(amount),0) into v_rev_last from public.payments where status='paid' and created_at::date >= v_lm_start and created_at::date < v_lm_end;
    if v_rev_last > 0 then
      v_pct := round((v_rev_this - v_rev_last) * 100.0 / v_rev_last, 1);
      if abs(v_pct) >= 10 then
        v_insights := v_insights || jsonb_build_array(jsonb_build_object(
          'type',     'revenue_mom',
          'severity', case when v_pct >= 0 then 'success' else 'warning' end,
          'icon',     case when v_pct >= 0 then '📈' else '📉' end,
          'title',    'Revenue ' || case when v_pct >= 0 then 'up' else 'down' end || ' ' || abs(v_pct) || '% vs last month',
          'body',     'This month ₹' || to_char(v_rev_this,'FM999,999,999') || ' vs last month ₹' || to_char(v_rev_last,'FM999,999,999'),
          'target',   '/admin/finance'
        ));
      end if;
    end if;
  end;

  -- ── 2. Agent performance change ──────────────────────────────
  begin
    for v_row in
      with this_month as (
        select
          case when reason like '%jewellery%' then 'Jewellery AI'
               when reason like '%textile%'   then 'Textile AI'
               when reason like '%productograph%' then 'Productography AI'
               else null end as agent,
          count(*)::int as cnt
        from public.credit_transactions
        where delta < 0 and created_at::date >= v_m_start
        group by 1
      ),
      last_month as (
        select
          case when reason like '%jewellery%' then 'Jewellery AI'
               when reason like '%textile%'   then 'Textile AI'
               when reason like '%productograph%' then 'Productography AI'
               else null end as agent,
          count(*)::int as cnt
        from public.credit_transactions
        where delta < 0 and created_at::date >= v_lm_start and created_at::date < v_lm_end
        group by 1
      )
      select t.agent, t.cnt as this_cnt, coalesce(l.cnt,0) as last_cnt,
             case when coalesce(l.cnt,0) > 0 then round((t.cnt - l.cnt)*100.0/l.cnt,1) else null end as pct
      from this_month t left join last_month l using (agent)
      where t.agent is not null and abs(case when coalesce(l.cnt,0) > 0 then (t.cnt - l.cnt)*100.0/l.cnt else 0 end) >= 15
    loop
      v_insights := v_insights || jsonb_build_array(jsonb_build_object(
        'type',     'agent_usage',
        'severity', case when v_row.pct >= 0 then 'success' else 'warning' end,
        'icon',     case when v_row.pct >= 0 then '🤖' else '⚠️' end,
        'title',    v_row.agent || ' usage ' || case when v_row.pct >= 0 then 'up ' else 'down ' end || abs(v_row.pct) || '% MoM',
        'body',     'This month: ' || v_row.this_cnt || ' generations vs last: ' || v_row.last_cnt,
        'target',   '/admin/ai-operations'
      ));
    end loop;
  end;

  -- ── 3. Plan renewals due this week ───────────────────────────
  declare
    v_due int;
  begin
    select count(*) into v_due from public.profiles
    where plan_expires_at between now() and now() + interval '7 days';
    if v_due > 0 then
      v_insights := v_insights || jsonb_build_array(jsonb_build_object(
        'type',     'renewals_due',
        'severity', 'warning',
        'icon',     '⏰',
        'title',    v_due || ' plan renewal(s) due this week',
        'body',     'Follow up now to prevent churn.',
        'target',   '/admin/subscriptions'
      ));
    end if;
  end;

  -- ── 4. Failed generations spike ──────────────────────────────
  begin
    declare
      v_failed_today int;
      v_failed_week  int;
    begin
      select count(*) filter (where created_at::date = v_today)::int,
             count(*) filter (where created_at::date >= v_w_start)::int
        into v_failed_today, v_failed_week
        from public.generations where status = 'failed';
      if v_failed_today >= 5 then
        v_insights := v_insights || jsonb_build_array(jsonb_build_object(
          'type',     'failed_gens',
          'severity', 'critical',
          'icon',     '🚨',
          'title',    v_failed_today || ' AI generations failed today',
          'body',     v_failed_week || ' failures this week — check n8n and FAL API status.',
          'target',   '/admin/ai-operations'
        ));
      end if;
    exception when undefined_table then null;
    end;
  end;

  -- ── 5. Credits running low for paying users ──────────────────
  declare
    v_low_credits int;
  begin
    select count(*) into v_low_credits from public.profiles
    where credits < 50 and plan is not null and plan not in ('','free');
    if v_low_credits > 0 then
      v_insights := v_insights || jsonb_build_array(jsonb_build_object(
        'type',     'low_credits',
        'severity', 'info',
        'icon',     '💎',
        'title',    v_low_credits || ' paying customer(s) running low on credits',
        'body',     'Send a top-up reminder or upgrade nudge.',
        'target',   '/admin/customers'
      ));
    end if;
  end;

  -- ── 6. No new leads today ────────────────────────────────────
  declare
    v_leads_today int;
  begin
    select count(*) into v_leads_today from public.leads where created_at::date = v_today;
    if v_leads_today = 0 and extract(hour from now()) >= 12 then
      v_insights := v_insights || jsonb_build_array(jsonb_build_object(
        'type',     'no_leads',
        'severity', 'warning',
        'icon',     '🎯',
        'title',    'No new leads today',
        'body',     'Check Meta and Google ad campaigns.',
        'target',   '/admin/marketing'
      ));
    end if;
  end;

  -- ── 7. New signups not converted ─────────────────────────────
  declare
    v_unconverted int;
  begin
    select count(*) into v_unconverted
    from public.profiles p
    where p.created_at::date >= v_today - 3
      and (p.plan is null or p.plan in ('','free'))
      and not exists (select 1 from public.payments py where py.user_id = p.id and py.status = 'paid');
    if v_unconverted >= 5 then
      v_insights := v_insights || jsonb_build_array(jsonb_build_object(
        'type',     'unconverted_signups',
        'severity', 'info',
        'icon',     '👤',
        'title',    v_unconverted || ' free signups in last 3 days — not converted',
        'body',     'Reach out with a demo or discount.',
        'target',   '/admin/customers'
      ));
    end if;
  end;

  return jsonb_build_object(
    'generated_at', now(),
    'insights',     v_insights,
    'count',        jsonb_array_length(v_insights)
  );
end;
$$;

revoke all on function public.ai_business_insights() from public;
grant execute on function public.ai_business_insights() to authenticated, service_role;
