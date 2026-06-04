-- ============================================================
-- AgentForge — Credits Overview Dashboard (Phase 3)
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── Permissions ─────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'credits.view', 'credits.adjust'
   ])), updated_at = now()
 where id in ('founder', 'admin');

-- ── credits_overview_metrics() ──────────────────────────────
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
  if not (
    current_user in ('service_role', 'postgres')
    or public.has_permission('credits.view')
    or public.has_permission('*')
  ) then
    raise exception 'credits_overview_metrics: permission denied';
  end if;

  with balances as (
    select
      coalesce(sum(credits), 0)::bigint as total_in_circulation,
      count(*)::int                     as total_users_with_credits,
      max(credits)::bigint              as highest_balance
    from public.profiles
    where credits > 0
  ),
  purchased as (
    select
      coalesce(sum(credits_added), 0)::bigint                                               as total_purchased,
      coalesce(sum(credits_added) filter (where created_at::date = v_today), 0)::bigint     as purchased_today,
      coalesce(sum(credits_added) filter (where created_at::date >= v_w_start), 0)::bigint  as purchased_week,
      coalesce(sum(credits_added) filter (where created_at::date >= v_m_start), 0)::bigint  as purchased_month
    from public.payments
    where status = 'paid'
  ),
  consumed as (
    select
      coalesce(abs(sum(delta)) filter (where delta < 0), 0)::bigint                                        as total_consumed,
      coalesce(abs(sum(delta)) filter (where delta < 0 and created_at::date = v_today), 0)::bigint         as consumed_today,
      coalesce(abs(sum(delta)) filter (where delta < 0 and created_at::date >= v_w_start), 0)::bigint      as consumed_week,
      coalesce(abs(sum(delta)) filter (where delta < 0 and created_at::date >= v_m_start), 0)::bigint      as consumed_month,
      coalesce(sum(delta) filter (where delta > 0 and reason like 'refund%'), 0)::bigint                   as total_refunded,
      coalesce(sum(delta) filter (where delta > 0 and reason like 'manual%'), 0)::bigint                   as total_manual_added
    from public.credit_transactions
  ),
  top_consumers as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'user_id',   x.user_id,
      'email',     p.email,
      'full_name', p.full_name,
      'plan',      p.plan,
      'balance',   p.credits,
      'consumed',  x.consumed
    ) order by x.consumed desc), '[]'::jsonb) as data
    from (
      select user_id, abs(sum(delta))::bigint as consumed
        from public.credit_transactions
        where delta < 0
        group by user_id
        order by consumed desc
        limit 10
    ) x
    left join public.profiles p on p.id = x.user_id
  ),
  recent_txns as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',         t.id,
      'user_id',    t.user_id,
      'email',      p.email,
      'delta',      t.delta,
      'reason',     t.reason,
      'balance_after', t.balance_after,
      'created_at', t.created_at
    ) order by t.created_at desc), '[]'::jsonb) as data
    from (
      select id, user_id, delta, reason, balance_after, created_at
        from public.credit_transactions
        order by created_at desc
        limit 30
    ) t
    left join public.profiles p on p.id = t.user_id
  )
  select jsonb_build_object(
    'balances',       row_to_json(b)::jsonb,
    'purchased',      row_to_json(pu)::jsonb,
    'consumed',       row_to_json(c)::jsonb,
    'top_consumers',  tc.data,
    'recent_txns',    rt.data
  ) into v_result
  from balances b, purchased pu, consumed c, top_consumers tc, recent_txns rt;

  return v_result;
exception
  when undefined_table or undefined_column then
    return jsonb_build_object('error', 'required tables missing');
end;
$$;

revoke all on function public.credits_overview_metrics() from public;
grant execute on function public.credits_overview_metrics() to authenticated, service_role;
