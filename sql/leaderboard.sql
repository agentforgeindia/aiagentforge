-- ============================================================
-- AgentForge — Sales Leaderboard + Gamification
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── Ensure leads.assigned_to exists (sales rep ownership) ────
alter table public.leads
  add column if not exists assigned_to text;

create index if not exists leads_assigned_idx on public.leads (assigned_to);

-- ── Badges table ─────────────────────────────────────────────
create table if not exists public.member_badges (
  id           uuid primary key default gen_random_uuid(),
  member_email text not null,
  badge_slug   text not null,
  badge_label  text not null,
  badge_icon   text not null default '🏅',
  awarded_at   timestamptz not null default now(),
  awarded_by   text,
  month        date,
  unique (member_email, badge_slug, month)
);

alter table public.member_badges enable row level security;
drop policy if exists "badges read"  on public.member_badges;
drop policy if exists "badges write" on public.member_badges;
create policy "badges read"  on public.member_badges for select to authenticated using (public.has_permission('team.view'));
create policy "badges write" on public.member_badges for all    to authenticated using (public.has_permission('incentives.manage')) with check (public.has_permission('incentives.manage'));

-- ── leaderboard_data() ───────────────────────────────────────
create or replace function public.leaderboard_data(
  p_month date default date_trunc('month', current_date)::date
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_m_start date := date_trunc('month', p_month)::date;
  v_m_end   date := (date_trunc('month', p_month) + interval '1 month' - interval '1 day')::date;
begin
  if not (current_user in ('service_role','postgres') or public.has_permission('team.view') or public.has_permission('*')) then
    raise exception 'leaderboard_data: permission denied';
  end if;

  return jsonb_build_object(
    'month', v_m_start,

    -- Revenue leaderboard from leads (converted by member)
    'revenue_board', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'rank',         row_number() over (order by revenue desc),
        'member_email', member_email,
        'revenue',      revenue,
        'deals',        deals,
        'leads_added',  leads_added
      ) order by revenue desc), '[]')
      from (
        select
          coalesce(assigned_to, 'unassigned') as member_email,
          count(*) filter (where status = 'converted')::int  as deals,
          count(*)::int                                      as leads_added,
          0::numeric                                         as revenue
        from public.leads
        where created_at::date between v_m_start and v_m_end
        group by assigned_to
      ) x
    ),

    -- Attendance leaderboard
    'attendance_board', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'rank',         row_number() over (order by total_mins desc),
        'member_email', member_email,
        'member_name',  member_name,
        'days',         days_present,
        'total_hours',  round(total_mins::numeric / 60, 1)
      ) order by total_mins desc), '[]')
      from (
        select member_email, member_name,
               count(distinct date)::int as days_present,
               coalesce(sum(duration_mins),0)::int as total_mins
          from public.attendance_logs
         where date between v_m_start and v_m_end
           and check_out is not null
         group by member_email, member_name
      ) x
    ),

    -- Badges this month
    'badges', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'member_email', member_email,
        'badge_slug',   badge_slug,
        'badge_label',  badge_label,
        'badge_icon',   badge_icon,
        'awarded_at',   awarded_at
      ) order by awarded_at desc), '[]')
      from public.member_badges
      where month = v_m_start or month is null
    ),

    -- Tasks leaderboard
    'tasks_board', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'rank',         row_number() over (order by done_count desc),
        'member_email', assigned_to_email,
        'done',         done_count,
        'pending',      pending_count
      ) order by done_count desc), '[]')
      from (
        select assigned_to_email,
               count(*) filter (where status = 'done')::int    as done_count,
               count(*) filter (where status != 'done')::int   as pending_count
          from public.tasks
         where created_at::date between v_m_start and v_m_end
           and assigned_to_email is not null
         group by assigned_to_email
      ) x
    )
  );
end;
$$;

revoke all on function public.leaderboard_data(date) from public;
grant execute on function public.leaderboard_data(date) to authenticated, service_role;
