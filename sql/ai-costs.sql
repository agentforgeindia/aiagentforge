-- ============================================================
-- AgentForge — AI Generation Cost Monitoring (Phase 2.4)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Tracks the *estimated* API cost of every generation so the
-- founder can see real profitability per agent + per customer.
--
-- Two tables:
--   agent_costs    — admin-edited catalogue of cost-per-generation
--                    per agent slug. Editable from /admin/ai-costs.
--   (existing public.generations — leveraged for counts)
--
-- One RPC:
--   ai_cost_metrics() returns a jsonb blob with:
--     • spend per agent today / week / month / lifetime
--     • top spend customers (their cost vs lifetime revenue)
--     • daily spend last 30 days
--     • failure rate per agent
--
-- Permission: ai_costs.view (founder + admin + accounts).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  Cost catalogue
-- ────────────────────────────────────────────────────────────
create table if not exists public.agent_costs (
  agent_slug                    text primary key,
  cost_per_generation_usd       numeric(10, 4) not null default 0,
  notes                         text,
  updated_at                    timestamptz not null default now(),
  updated_by                    uuid references auth.users(id) on delete set null
);

-- One row per known agent slug. Initial defaults — adjust in UI.
insert into public.agent_costs (agent_slug, cost_per_generation_usd, notes)
values
  ('jewellery',          0.04, 'FAL Flux dev — approx'),
  ('textile',            0.04, 'FAL Flux dev — approx'),
  ('productography',     0.04, 'FAL Flux dev — approx'),
  ('ugc',                0.06, 'Higher quality model'),
  ('social-ads',         0.05, 'Templated composer + image'),
  ('trendforge',         0.02, 'Text + light image'),
  ('election-campaign',  0.05, 'Templated composer + image')
on conflict (agent_slug) do nothing;

-- ────────────────────────────────────────────────────────────
-- 2.  USD-INR rate (admin override, cached)
-- ────────────────────────────────────────────────────────────
create table if not exists public.ai_cost_settings (
  id                int primary key default 1 check (id = 1),
  usd_to_inr_rate   numeric(8, 4) not null default 83.5,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id) on delete set null
);

insert into public.ai_cost_settings (id) values (1) on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- 3.  RLS — admins read, write needs ai_costs.edit
-- ────────────────────────────────────────────────────────────
alter table public.agent_costs       enable row level security;
alter table public.ai_cost_settings  enable row level security;

drop policy if exists "agent_costs read"      on public.agent_costs;
drop policy if exists "agent_costs write"     on public.agent_costs;
drop policy if exists "ai_cost_settings read" on public.ai_cost_settings;
drop policy if exists "ai_cost_settings write" on public.ai_cost_settings;

create policy "agent_costs read"
  on public.agent_costs for select to authenticated
  using (public.has_permission('ai_costs.view'));

create policy "agent_costs write"
  on public.agent_costs for all to authenticated
  using (public.has_permission('ai_costs.edit'))
  with check (public.has_permission('ai_costs.edit'));

create policy "ai_cost_settings read"
  on public.ai_cost_settings for select to authenticated
  using (public.has_permission('ai_costs.view'));

create policy "ai_cost_settings write"
  on public.ai_cost_settings for all to authenticated
  using (public.has_permission('ai_costs.edit'))
  with check (public.has_permission('ai_costs.edit'));

-- ────────────────────────────────────────────────────────────
-- 4.  Permissions — add to roles
-- ────────────────────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'ai_costs.view', 'ai_costs.edit'
   ])),
   updated_at = now()
 where id = 'admin';

update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'ai_costs.view'
   ])),
   updated_at = now()
 where id = 'accounts';

-- ────────────────────────────────────────────────────────────
-- 5.  ai_cost_metrics() — the dashboard's single RPC
-- ────────────────────────────────────────────────────────────
-- generations table is assumed to have:
--   user_id, agent_type (or agent_slug), status, created_at.
-- We tolerate either column name by coalescing.
-- ────────────────────────────────────────────────────────────

create or replace function public.ai_cost_metrics()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today    date := current_date;
  v_w_start  date := current_date - 7;
  v_m_start  date := date_trunc('month', current_date)::date;

  v_rate     numeric;
  v_spend_today    numeric;
  v_spend_week     numeric;
  v_spend_month    numeric;
  v_spend_lifetime numeric;

  v_per_agent      jsonb;
  v_top_customers  jsonb;
  v_daily          jsonb;
  v_fail           jsonb;
begin
  if not (
    current_user in ('service_role', 'postgres')
    or public.has_permission('ai_costs.view')
    or public.has_permission('*')
  ) then
    raise exception 'ai_cost_metrics: caller lacks ai_costs.view permission';
  end if;

  select usd_to_inr_rate into v_rate from public.ai_cost_settings where id = 1;
  v_rate := coalesce(v_rate, 83.5);

  -- Determine which column the generations table uses for agent.
  -- We compute a CTE that normalises to agent_slug.
  --
  -- NOTE: requires public.generations table. If your schema names
  -- it differently the metrics will return zeros — adjust below.

  with g as (
    select
      coalesce(agent_type, agent_slug, agent) as agent_slug,
      user_id,
      status,
      created_at
    from public.generations
    where status is not null
  ),
  joined as (
    select g.*, c.cost_per_generation_usd as cost_usd
      from g
      left join public.agent_costs c on c.agent_slug = g.agent_slug
  )
  select
    coalesce(sum(case when created_at::date = v_today then cost_usd else 0 end), 0)        as today,
    coalesce(sum(case when created_at::date >= v_w_start then cost_usd else 0 end), 0)     as week,
    coalesce(sum(case when created_at::date >= v_m_start then cost_usd else 0 end), 0)     as month,
    coalesce(sum(cost_usd), 0)                                                              as lifetime
  into v_spend_today, v_spend_week, v_spend_month, v_spend_lifetime
  from joined;

  -- Per agent breakdown (lifetime)
  with g as (
    select coalesce(agent_type, agent_slug, agent) as agent_slug, status
      from public.generations
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'agent_slug', x.agent_slug,
    'total',      x.total,
    'success',    x.success,
    'failed',     x.failed,
    'cost_usd',   x.cost_usd,
    'cost_inr',   round(x.cost_usd * v_rate, 2)
  ) order by x.total desc), '[]'::jsonb) into v_per_agent
  from (
    select
      g.agent_slug,
      count(*)::int                                              as total,
      count(*) filter (where g.status = 'completed')::int        as success,
      count(*) filter (where g.status = 'failed')::int           as failed,
      coalesce(count(*) * coalesce(c.cost_per_generation_usd, 0), 0)::numeric(12,4) as cost_usd
    from g
    left join public.agent_costs c on c.agent_slug = g.agent_slug
    group by g.agent_slug, c.cost_per_generation_usd
  ) x;

  -- Top spend customers (lifetime cost vs lifetime revenue)
  with g as (
    select coalesce(agent_type, agent_slug, agent) as agent_slug, user_id
      from public.generations
  ),
  spends as (
    select g.user_id,
           sum(coalesce(c.cost_per_generation_usd, 0))::numeric(12,4) as cost_usd,
           count(*)::int                                              as gens
      from g
      left join public.agent_costs c on c.agent_slug = g.agent_slug
     group by g.user_id
  ),
  rev as (
    select user_id, sum(amount)::numeric(12,2) as revenue_inr
      from public.payments
      where status = 'paid'
      group by user_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id',     s.user_id,
    'email',       p.email,
    'full_name',   p.full_name,
    'gens',        s.gens,
    'cost_usd',    s.cost_usd,
    'cost_inr',    round(s.cost_usd * v_rate, 2),
    'revenue_inr', coalesce(r.revenue_inr, 0),
    'margin_inr',  round(coalesce(r.revenue_inr, 0) - s.cost_usd * v_rate, 2)
  ) order by s.cost_usd desc), '[]'::jsonb)
  into v_top_customers
  from (
    select user_id, cost_usd, gens from spends order by cost_usd desc limit 10
  ) s
  left join public.profiles p on p.id = s.user_id
  left join rev r on r.user_id = s.user_id;

  -- Daily spend last 30 days (0-filled)
  with days as (
    select generate_series(v_today - 29, v_today, interval '1 day')::date as d
  ),
  g as (
    select coalesce(agent_type, agent_slug, agent) as agent_slug, created_at
      from public.generations
      where created_at::date >= v_today - 29
  ),
  d as (
    select g.created_at::date as d,
           sum(coalesce(c.cost_per_generation_usd, 0))::numeric(12,4) as cost_usd
      from g
      left join public.agent_costs c on c.agent_slug = g.agent_slug
     group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'd', to_char(days.d, 'YYYY-MM-DD'),
    'cost_usd', coalesce(d.cost_usd, 0),
    'cost_inr', round(coalesce(d.cost_usd, 0) * v_rate, 2)
  ) order by days.d), '[]'::jsonb) into v_daily
  from days left join d using (d);

  -- Failure rate per agent (last 30 days)
  with g as (
    select coalesce(agent_type, agent_slug, agent) as agent_slug, status
      from public.generations
      where created_at::date >= v_today - 29
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'agent_slug', agent_slug,
    'total',      total,
    'failed',     failed,
    'failure_rate_pct', case when total = 0 then 0
                             else round(failed * 100.0 / total, 1) end
  ) order by failure_rate_pct desc), '[]'::jsonb)
  into v_fail
  from (
    select agent_slug, count(*)::int as total,
           count(*) filter (where status = 'failed')::int as failed
      from g
      group by 1
  ) x;

  return jsonb_build_object(
    'spend_usd', jsonb_build_object(
      'today',    v_spend_today,
      'week',     v_spend_week,
      'month',    v_spend_month,
      'lifetime', v_spend_lifetime
    ),
    'spend_inr', jsonb_build_object(
      'today',    round(v_spend_today * v_rate, 2),
      'week',     round(v_spend_week  * v_rate, 2),
      'month',    round(v_spend_month * v_rate, 2),
      'lifetime', round(v_spend_lifetime * v_rate, 2)
    ),
    'usd_to_inr_rate', v_rate,
    'per_agent',       v_per_agent,
    'top_customers',   v_top_customers,
    'daily',           v_daily,
    'failure',         v_fail
  );
exception
  -- If generations table doesn't exist or schema differs, return zeros
  -- rather than crash. Admin can still edit the cost catalogue.
  when undefined_table or undefined_column then
    return jsonb_build_object(
      'spend_usd', jsonb_build_object('today',0,'week',0,'month',0,'lifetime',0),
      'spend_inr', jsonb_build_object('today',0,'week',0,'month',0,'lifetime',0),
      'usd_to_inr_rate', v_rate,
      'per_agent', '[]'::jsonb,
      'top_customers', '[]'::jsonb,
      'daily', '[]'::jsonb,
      'failure', '[]'::jsonb,
      'note', 'generations table missing or column mismatch — edit catalogue and re-run when generations table exists'
    );
end;
$$;

revoke all on function public.ai_cost_metrics() from public;
grant execute on function public.ai_cost_metrics() to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- select * from public.agent_costs;
-- select * from public.ai_cost_settings;
-- select public.ai_cost_metrics();
-- ============================================================
