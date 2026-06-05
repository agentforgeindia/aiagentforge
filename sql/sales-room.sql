-- ============================================================
-- AgentForge — Sales War Room (kudos, stats, internal ping)
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── 1. Kudos / appreciation between teammates ────────────────
create table if not exists public.sales_kudos (
  id          uuid primary key default gen_random_uuid(),
  from_email  text not null,
  to_email    text not null,
  emoji       text not null default '👏',
  message     text,
  created_at  timestamptz not null default now()
);
create index if not exists kudos_to_idx on public.sales_kudos (to_email, created_at desc);

alter table public.sales_kudos enable row level security;
drop policy if exists "kudos read"  on public.sales_kudos;
drop policy if exists "kudos write" on public.sales_kudos;
create policy "kudos read"  on public.sales_kudos for select to authenticated using (public.is_admin());
create policy "kudos write" on public.sales_kudos for insert to authenticated with check (public.is_admin());

-- ── 2. Internal team ping (emergency → founder/admin bell) ───
create or replace function public.ping_head_office(p_message text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_email text; v_id uuid;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select email into v_email from auth.users where id = auth.uid();
  -- Reuses the admin notifications system with a high-priority type.
  v_id := public.create_notification(
    'team.ping',
    '🚨 Team ping from ' || coalesce(v_email,'a teammate'),
    p_message,
    '/admin/sales-room',
    'critical',
    null,           -- no permission filter → all admins see it
    null
  );
  return v_id;
end;
$$;
revoke all on function public.ping_head_office(text) from public;
grant execute on function public.ping_head_office(text) to authenticated, service_role;

-- ── 3. sales_room_stats() — leaderboard + targets + kudos ────
create or replace function public.sales_room_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today   date := current_date;
  v_w_start date := current_date - 6;
  v_m_start date := date_trunc('month', current_date)::date;
begin
  if not public.is_admin() then raise exception 'sales_room_stats: not authorized'; end if;

  return jsonb_build_object(
    'agents', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'member',        member,
        'display',       split_part(member, '@', 1),
        'sales_today',   sales_today,
        'sales_week',    sales_week,
        'sales_month',   sales_month,
        'leads_month',   leads_month,
        'incentive',     incentive,
        'kudos',         kudos,
        'rank',          row_number() over (order by sales_month desc, sales_week desc)
      ) order by sales_month desc, sales_week desc), '[]')
      from (
        select
          coalesce(l.assigned_to, 'unassigned') as member,
          count(*) filter (where l.status='converted' and l.updated_at::date = v_today)::int     as sales_today,
          count(*) filter (where l.status='converted' and l.updated_at::date >= v_w_start)::int  as sales_week,
          count(*) filter (where l.status='converted' and l.updated_at::date >= v_m_start)::int  as sales_month,
          count(*) filter (where l.created_at::date >= v_m_start)::int                           as leads_month,
          -- incentive = converted this month × ₹500 flat (tune as needed)
          (count(*) filter (where l.status='converted' and l.updated_at::date >= v_m_start) * 500)::int as incentive,
          (select count(*) from public.sales_kudos k where lower(k.to_email) = lower(l.assigned_to))::int as kudos
        from public.leads l
        where l.assigned_to is not null
        group by l.assigned_to
      ) x
    ),
    'daily_achiever', (
      select coalesce(split_part(assigned_to,'@',1), null)
      from public.leads
      where status='converted' and updated_at::date = v_today and assigned_to is not null
      group by assigned_to order by count(*) desc limit 1
    ),
    'weekly_achiever', (
      select coalesce(split_part(assigned_to,'@',1), null)
      from public.leads
      where status='converted' and updated_at::date >= v_w_start and assigned_to is not null
      group by assigned_to order by count(*) desc limit 1
    ),
    -- Tiered targets / bonus ladder
    'targets', jsonb_build_array(
      jsonb_build_object('label','Starter',  'per_day', 1,  'bonus', 'Daily ₹200'),
      jsonb_build_object('label','Pro',      'per_day', 5,  'bonus', 'Daily ₹1,500'),
      jsonb_build_object('label','Champion', 'per_day', 10, 'bonus', 'Daily ₹4,000 + trophy')
    )
  );
exception when undefined_table or undefined_column then
  return jsonb_build_object('agents','[]'::jsonb,'error','leads/kudos table missing');
end;
$$;
revoke all on function public.sales_room_stats() from public;
grant execute on function public.sales_room_stats() to authenticated, service_role;

-- ── 4. my_sales_earnings() — a rep tracks their own numbers ──
create or replace function public.my_sales_earnings()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_email text;
  v_m_start date := date_trunc('month', current_date)::date;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return jsonb_build_object('error','not logged in'); end if;

  return jsonb_build_object(
    'email', v_email,
    'sales_month',  (select count(*) from public.leads where lower(assigned_to)=lower(v_email) and status='converted' and updated_at::date >= v_m_start),
    'leads_month',  (select count(*) from public.leads where lower(assigned_to)=lower(v_email) and created_at::date >= v_m_start),
    'incentive',    (select count(*) from public.leads where lower(assigned_to)=lower(v_email) and status='converted' and updated_at::date >= v_m_start) * 500,
    'kudos',        (select count(*) from public.sales_kudos where lower(to_email)=lower(v_email)),
    'base_salary',  (select base_salary from public.hr_employees where lower(email)=lower(v_email) limit 1)
  );
exception when undefined_table then
  return jsonb_build_object('error','tables missing');
end;
$$;
revoke all on function public.my_sales_earnings() from public;
grant execute on function public.my_sales_earnings() to authenticated, service_role;
