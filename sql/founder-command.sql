-- ============================================================
-- AgentForge — Founder Command Center
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Goals/targets + cash-in-bank + outstanding + live numbers,
-- all in one RPC for the founder-only command page.
-- ============================================================

-- ── Monthly goals/targets ────────────────────────────────────
create table if not exists public.founder_goals (
  month               date primary key,        -- first day of month
  revenue_target      numeric(14,2) not null default 0,
  customers_target    int not null default 0,
  generations_target  int not null default 0,
  updated_at          timestamptz not null default now()
);

alter table public.founder_goals enable row level security;
drop policy if exists "founder_goals read"  on public.founder_goals;
drop policy if exists "founder_goals write" on public.founder_goals;
create policy "founder_goals read"  on public.founder_goals for select to authenticated using (public.has_permission('*') or public.has_permission('dashboard.view'));
create policy "founder_goals write" on public.founder_goals for all    to authenticated using (public.has_permission('*')) with check (public.has_permission('*'));

-- Cash-in-bank is a manual figure the founder updates — store in system_settings.
insert into public.system_settings (key, value, label, category)
values ('finance.cash_in_bank', '0', 'Cash in Bank (₹)', 'finance')
on conflict (key) do nothing;

-- ── founder_command_metrics() ────────────────────────────────
create or replace function public.founder_command_metrics()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today    date := current_date;
  v_m_start  date := date_trunc('month', current_date)::date;
  v_result   jsonb;
  v_goal     record;
  v_rev_month numeric;
  v_cust_month int;
  v_gens_month int;
begin
  if not (public.has_permission('*') or public.has_permission('dashboard.view')) then
    raise exception 'founder_command_metrics: permission denied';
  end if;

  select coalesce(sum(amount),0) into v_rev_month
    from public.payments where status='paid' and created_at::date >= v_m_start;

  select count(*) into v_cust_month
    from public.payments where status='paid' and created_at::date >= v_m_start;

  begin
    select count(*) into v_gens_month from public.generations where created_at::date >= v_m_start;
  exception when undefined_table then v_gens_month := 0; end;

  select * into v_goal from public.founder_goals where month = v_m_start;

  v_result := jsonb_build_object(
    'live', jsonb_build_object(
      'revenue_today',      (select coalesce(sum(amount),0) from public.payments where status='paid' and created_at::date = v_today),
      'revenue_month',      v_rev_month,
      'cash_in_bank',       (select coalesce((value)::numeric, 0) from public.system_settings where key='finance.cash_in_bank'),
      'outstanding',        (select coalesce(sum(amount),0) from public.payments where status in ('created','pending','attempted')),
      'lifetime_revenue',   (select coalesce(sum(amount),0) from public.payments where status='paid'),
      'active_subs',        (select count(*) from public.profiles where plan_expires_at > now())
    ),
    'goals', jsonb_build_object(
      'revenue_target',     coalesce(v_goal.revenue_target, 0),
      'revenue_actual',     v_rev_month,
      'revenue_pct',        case when coalesce(v_goal.revenue_target,0) > 0 then round(v_rev_month*100/v_goal.revenue_target,1) else null end,
      'customers_target',   coalesce(v_goal.customers_target, 0),
      'customers_actual',   v_cust_month,
      'customers_pct',      case when coalesce(v_goal.customers_target,0) > 0 then round(v_cust_month*100.0/v_goal.customers_target,1) else null end,
      'generations_target', coalesce(v_goal.generations_target, 0),
      'generations_actual', v_gens_month,
      'generations_pct',    case when coalesce(v_goal.generations_target,0) > 0 then round(v_gens_month*100.0/v_goal.generations_target,1) else null end
    ),
    'team', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'member', member_email,
        'leads',  leads_added,
        'won',    deals_won
      ) order by deals_won desc), '[]')
      from (
        select coalesce(assigned_to,'unassigned') as member_email,
               count(*)::int as leads_added,
               count(*) filter (where status='converted')::int as deals_won
        from public.leads
        where created_at::date >= v_m_start
        group by assigned_to
      ) x
    )
  );

  return v_result;
exception when undefined_table or undefined_column then
  return jsonb_build_object('error', 'tables missing');
end;
$$;

revoke all on function public.founder_command_metrics() from public;
grant execute on function public.founder_command_metrics() to authenticated, service_role;
