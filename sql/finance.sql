-- ============================================================
-- AgentForge — Finance Dashboard (Phase 3)
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── 1. Manual expenses table ─────────────────────────────────
create table if not exists public.finance_expenses (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in (
                'hosting', 'api_cost', 'salary', 'meta_ads',
                'google_ads', 'software', 'other'
              )),
  label       text not null,
  amount_inr  numeric(12, 2) not null,
  expense_date date not null default current_date,
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists finance_expenses_date_idx
  on public.finance_expenses (expense_date desc);

alter table public.finance_expenses enable row level security;

drop policy if exists "finance_expenses read" on public.finance_expenses;
drop policy if exists "finance_expenses write" on public.finance_expenses;

create policy "finance_expenses read"
  on public.finance_expenses for select to authenticated
  using (public.has_permission('finance.view'));

create policy "finance_expenses write"
  on public.finance_expenses for all to authenticated
  using (public.has_permission('finance.edit'))
  with check (public.has_permission('finance.edit'));

-- ── 2. Permissions ───────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'finance.view', 'finance.edit'
   ])), updated_at = now()
 where id = 'founder';

update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'finance.view'
   ])), updated_at = now()
 where id = 'admin';

-- ── 3. finance_metrics() ────────────────────────────────────
create or replace function public.finance_metrics()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today   date := current_date;
  v_w_start date := current_date - 6;
  v_m_start date := date_trunc('month', current_date)::date;
  v_y_start date := date_trunc('year',  current_date)::date;
  v_result  jsonb;
begin
  if not (
    current_user in ('service_role', 'postgres')
    or public.has_permission('finance.view')
    or public.has_permission('*')
  ) then
    raise exception 'finance_metrics: permission denied';
  end if;

  with revenue as (
    select
      coalesce(sum(amount), 0)::numeric(14,2)                                               as lifetime,
      coalesce(sum(amount) filter (where created_at::date = v_today), 0)::numeric(14,2)     as today,
      coalesce(sum(amount) filter (where created_at::date >= v_w_start), 0)::numeric(14,2)  as week,
      coalesce(sum(amount) filter (where created_at::date >= v_m_start), 0)::numeric(14,2)  as month,
      coalesce(sum(amount) filter (where created_at::date >= v_y_start), 0)::numeric(14,2)  as year
    from public.payments
    where status = 'paid'
  ),
  refunds as (
    select coalesce(sum(coalesce(refund_amount, amount)), 0)::numeric(14,2) as total_refunded
    from public.payments
    where status in ('refunded', 'partially_refunded')
  ),
  expenses_summary as (
    select
      coalesce(sum(amount_inr), 0)::numeric(14,2)                                                    as total,
      coalesce(sum(amount_inr) filter (where expense_date >= v_m_start), 0)::numeric(14,2)           as this_month,
      coalesce(sum(amount_inr) filter (where category = 'hosting'), 0)::numeric(14,2)                as hosting,
      coalesce(sum(amount_inr) filter (where category = 'api_cost'), 0)::numeric(14,2)               as api_cost,
      coalesce(sum(amount_inr) filter (where category = 'salary'), 0)::numeric(14,2)                 as salary,
      coalesce(sum(amount_inr) filter (where category = 'meta_ads'), 0)::numeric(14,2)               as meta_ads,
      coalesce(sum(amount_inr) filter (where category = 'google_ads'), 0)::numeric(14,2)             as google_ads,
      coalesce(sum(amount_inr) filter (where category = 'software'), 0)::numeric(14,2)               as software,
      coalesce(sum(amount_inr) filter (where category = 'other'), 0)::numeric(14,2)                  as other
    from public.finance_expenses
  ),
  monthly_rev as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'm',       to_char(mo, 'YYYY-MM'),
      'revenue', coalesce(rev, 0),
      'expense', coalesce(exp, 0),
      'profit',  coalesce(rev, 0) - coalesce(exp, 0)
    ) order by mo), '[]'::jsonb) as data
    from (
      select d::date as mo
      from generate_series(
        date_trunc('month', current_date - interval '5 months'),
        date_trunc('month', current_date),
        interval '1 month'
      ) d
    ) months(mo)
    left join (
      select date_trunc('month', created_at)::date as m, sum(amount)::numeric(14,2) as rev
        from public.payments where status = 'paid' group by 1
    ) r on r.m = mo
    left join (
      select date_trunc('month', expense_date)::date as m, sum(amount_inr)::numeric(14,2) as exp
        from public.finance_expenses group by 1
    ) e on e.m = mo
  ),
  recent_expenses as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',           id,
      'category',     category,
      'label',        label,
      'amount_inr',   amount_inr,
      'expense_date', expense_date,
      'notes',        notes
    ) order by expense_date desc, created_at desc), '[]'::jsonb) as data
    from public.finance_expenses
    order by expense_date desc
    limit 30
  )
  select jsonb_build_object(
    'revenue',          row_to_json(rev)::jsonb,
    'refunds',          row_to_json(ref)::jsonb,
    'expenses',         row_to_json(exp)::jsonb,
    'net_profit_month', (rev.month - ref.total_refunded - exp.this_month),
    'monthly',          mr.data,
    'recent_expenses',  re.data
  ) into v_result
  from revenue rev, refunds ref, expenses_summary exp, monthly_rev mr, recent_expenses re;

  return v_result;
exception
  when undefined_table or undefined_column then
    return jsonb_build_object('error', 'required tables missing');
end;
$$;

revoke all on function public.finance_metrics() from public;
grant execute on function public.finance_metrics() to authenticated, service_role;
