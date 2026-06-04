-- ============================================================
-- AgentForge — Incentive Engine
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── 1. Commission rules ──────────────────────────────────────
create table if not exists public.commission_rules (
  id          uuid primary key default gen_random_uuid(),
  plan_name   text not null unique,   -- 'starter', 'pro', 'empire', 'custom'
  amount_inr  numeric(10,2) not null, -- flat incentive per sale
  percent_pct numeric(5,2),           -- or % of revenue (optional)
  notes       text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

insert into public.commission_rules (plan_name, amount_inr, notes) values
  ('starter', 200,  'Flat ₹200 per Starter plan sale'),
  ('pro',     1000, 'Flat ₹1,000 per Pro Creator sale'),
  ('empire',  4000, 'Flat ₹4,000 per Empire sale'),
  ('custom',  0,    '5% of deal value — set manually')
on conflict (plan_name) do nothing;

alter table public.commission_rules enable row level security;
drop policy if exists "commission_rules read"  on public.commission_rules;
drop policy if exists "commission_rules write" on public.commission_rules;
create policy "commission_rules read"  on public.commission_rules for select to authenticated using (public.has_permission('incentives.view'));
create policy "commission_rules write" on public.commission_rules for all    to authenticated using (public.has_permission('incentives.manage')) with check (public.has_permission('incentives.manage'));

-- ── 2. Monthly targets ───────────────────────────────────────
create table if not exists public.sales_targets (
  id           uuid primary key default gen_random_uuid(),
  member_email text not null,
  month        date not null,  -- first day of month
  target_inr   numeric(12,2) not null,
  updated_at   timestamptz not null default now(),
  unique (member_email, month)
);

alter table public.sales_targets enable row level security;
drop policy if exists "sales_targets read"  on public.sales_targets;
drop policy if exists "sales_targets write" on public.sales_targets;
create policy "sales_targets read"  on public.sales_targets for select to authenticated using (public.has_permission('incentives.view'));
create policy "sales_targets write" on public.sales_targets for all    to authenticated using (public.has_permission('incentives.manage')) with check (public.has_permission('incentives.manage'));

-- ── 3. Permissions ───────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['incentives.view','incentives.manage'])), updated_at = now()
 where id = 'founder';

update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['incentives.view'])), updated_at = now()
 where id in ('admin','sales');

-- ── 4. incentive_overview() ──────────────────────────────────
create or replace function public.incentive_overview(
  p_month date default date_trunc('month', current_date)::date
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_m_start date := date_trunc('month', p_month)::date;
  v_m_end   date := (date_trunc('month', p_month) + interval '1 month' - interval '1 day')::date;
begin
  if not (current_user in ('service_role','postgres') or public.has_permission('incentives.view') or public.has_permission('*')) then
    raise exception 'incentive_overview: permission denied';
  end if;

  return (
    select jsonb_build_object(
      'month',       v_m_start,
      'rules',       (select coalesce(jsonb_agg(jsonb_build_object('plan_name',plan_name,'amount_inr',amount_inr,'percent_pct',percent_pct,'notes',notes) order by amount_inr desc), '[]') from public.commission_rules),
      'performance', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'member_email',    p.billing_email,
          'deals',           count(*)::int,
          'revenue',         sum(p.amount)::numeric(12,2),
          'target',          coalesce(t.target_inr, 0),
          'achievement_pct', case when coalesce(t.target_inr,0) > 0 then round(sum(p.amount)*100/t.target_inr,1) else null end,
          'incentive_earned',(
            select coalesce(sum(
              case
                when lower(p2.plan) like '%empire%' then 4000
                when lower(p2.plan) like '%pro%'    then 1000
                else 200
              end
            ), 0)
            from public.payments p2
            where p2.billing_email = p.billing_email
              and p2.status = 'paid'
              and p2.created_at::date between v_m_start and v_m_end
          )
        ) order by sum(p.amount) desc), '[]')
        from public.payments p
        left join public.sales_targets t
          on lower(t.member_email) = lower(p.billing_email)
          and t.month = v_m_start
        where p.status = 'paid'
          and p.created_at::date between v_m_start and v_m_end
          and p.billing_email is not null
        group by p.billing_email, t.target_inr
      ),
      'total_revenue',  (select coalesce(sum(amount),0) from public.payments where status='paid' and created_at::date between v_m_start and v_m_end),
      'total_incentive_paid', (
        select coalesce(sum(
          case when lower(plan) like '%empire%' then 4000
               when lower(plan) like '%pro%'    then 1000
               else 200
          end
        ), 0)
        from public.payments
        where status='paid' and created_at::date between v_m_start and v_m_end
      )
    )
  );
end;
$$;

revoke all on function public.incentive_overview(date) from public;
grant execute on function public.incentive_overview(date) to authenticated, service_role;
