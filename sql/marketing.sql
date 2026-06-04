-- ============================================================
-- AgentForge — Marketing Center (Phase 2)
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── Permissions ─────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'marketing.view'
   ])), updated_at = now()
 where id in ('founder', 'admin');

-- ── marketing_metrics() ─────────────────────────────────────
create or replace function public.marketing_metrics()
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
    or public.has_permission('marketing.view')
    or public.has_permission('*')
  ) then
    raise exception 'marketing_metrics: permission denied';
  end if;

  with lead_counts as (
    select
      count(*)::int                                                               as total_leads,
      count(*) filter (where created_at::date = v_today)::int                    as leads_today,
      count(*) filter (where created_at::date >= v_w_start)::int                 as leads_week,
      count(*) filter (where created_at::date >= v_m_start)::int                 as leads_month,
      count(*) filter (where source in ('facebook','instagram'))::int             as meta_leads,
      count(*) filter (where source = 'google')::int                             as google_leads,
      count(*) filter (where source = 'instagram')::int                          as instagram_leads,
      count(*) filter (where source = 'facebook')::int                           as facebook_leads,
      count(*) filter (where source = 'whatsapp')::int                           as whatsapp_leads,
      count(*) filter (where source = 'website')::int                            as website_leads,
      count(*) filter (where source = 'referral')::int                           as referral_leads,
      count(*) filter (where status = 'converted')::int                          as converted,
      count(*) filter (where status = 'new')::int                                as new_leads
    from public.leads
  ),
  by_source as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'source', source,
      'total',  total,
      'month',  month_count,
      'converted', converted
    ) order by total desc), '[]'::jsonb) as data
    from (
      select
        source,
        count(*)::int                                               as total,
        count(*) filter (where created_at::date >= v_m_start)::int as month_count,
        count(*) filter (where status = 'converted')::int          as converted
      from public.leads
      group by source
    ) x
  ),
  daily_leads as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'd',      to_char(dd, 'YYYY-MM-DD'),
      'total',  coalesce(cnt, 0),
      'meta',   coalesce(meta, 0),
      'google', coalesce(google, 0)
    ) order by dd), '[]'::jsonb) as data
    from (
      select d::date as dd from generate_series(
        (v_today - 29)::timestamp,
        v_today::timestamp,
        interval '1 day'
      ) d
    ) days
    left join (
      select
        created_at::date as d,
        count(*)::int as cnt,
        count(*) filter (where source in ('facebook','instagram'))::int as meta,
        count(*) filter (where source = 'google')::int as google
      from public.leads
      where created_at::date >= v_today - 29
      group by 1
    ) x on x.d = days.dd
  ),
  email_stats as (
    select
      count(*)::int                                              as total_sent,
      count(*) filter (where status = 'sent')::int              as sent,
      count(*) filter (where status = 'queued')::int            as queued,
      count(*) filter (where status = 'failed')::int            as failed,
      count(*) filter (where status = 'dry_run')::int           as dry_run,
      count(*) filter (where created_at::date = v_today)::int   as sent_today,
      count(*) filter (where created_at::date >= v_m_start)::int as sent_month
    from public.email_events
  ),
  email_by_template as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'template', template_slug,
      'total',    total,
      'sent',     sent,
      'failed',   failed
    ) order by total desc), '[]'::jsonb) as data
    from (
      select
        template_slug,
        count(*)::int                                           as total,
        count(*) filter (where status = 'sent')::int            as sent,
        count(*) filter (where status = 'failed')::int          as failed
      from public.email_events
      group by template_slug
    ) x
  )
  select jsonb_build_object(
    'leads',              row_to_json(lc)::jsonb,
    'by_source',          bs.data,
    'daily_leads',        dl.data,
    'email',              row_to_json(es)::jsonb,
    'email_by_template',  ebt.data
  ) into v_result
  from lead_counts lc, by_source bs, daily_leads dl, email_stats es, email_by_template ebt;

  return v_result;
exception
  when undefined_table or undefined_column then
    return jsonb_build_object('error', 'required tables missing');
end;
$$;

revoke all on function public.marketing_metrics() from public;
grant execute on function public.marketing_metrics() to authenticated, service_role;
