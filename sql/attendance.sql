-- ============================================================
-- AgentForge — Team Attendance System
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── 1. Attendance logs table ─────────────────────────────────
create table if not exists public.attendance_logs (
  id            uuid primary key default gen_random_uuid(),
  member_email  text not null,
  member_name   text,
  check_in      timestamptz not null default now(),
  check_out     timestamptz,
  duration_mins int generated always as (
    case when check_out is not null
         then extract(epoch from (check_out - check_in)) / 60
         else null
    end
  ) stored,
  work_notes    text,
  date          date not null default current_date,
  created_at    timestamptz not null default now()
);

create index if not exists attendance_date_idx    on public.attendance_logs (date desc);
create index if not exists attendance_member_idx  on public.attendance_logs (member_email, date desc);

alter table public.attendance_logs enable row level security;

-- Team members can manage their own records
drop policy if exists "attendance own"  on public.attendance_logs;
drop policy if exists "attendance admin" on public.attendance_logs;

create policy "attendance own"
  on public.attendance_logs for all to authenticated
  using (lower(member_email) = lower((select email from auth.users where id = auth.uid())))
  with check (lower(member_email) = lower((select email from auth.users where id = auth.uid())));

-- Admins can read all
create policy "attendance admin"
  on public.attendance_logs for select to authenticated
  using (public.has_permission('team.view'));

-- ── 2. Permissions ───────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'attendance.view', 'attendance.manage'
   ])), updated_at = now()
 where id = 'founder';

update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'attendance.view'
   ])), updated_at = now()
 where id = 'admin';

-- All admin_users can log their own attendance (via RLS own policy)

-- ── 3. attendance_overview() ─────────────────────────────────
create or replace function public.attendance_overview(p_date date default current_date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not (
    current_user in ('service_role', 'postgres')
    or public.has_permission('team.view')
    or public.has_permission('*')
  ) then
    raise exception 'attendance_overview: permission denied';
  end if;

  with today_logs as (
    select
      member_email,
      member_name,
      check_in,
      check_out,
      duration_mins,
      work_notes,
      id
    from public.attendance_logs
    where date = p_date
    order by check_in desc
  ),
  currently_online as (
    select member_email, member_name, check_in
    from public.attendance_logs
    where date = p_date and check_out is null
  ),
  monthly_summary as (
    select
      member_email,
      member_name,
      count(distinct date)::int                               as days_present,
      coalesce(sum(duration_mins), 0)::int                   as total_mins,
      round(avg(duration_mins))::int                          as avg_mins_per_day
    from public.attendance_logs
    where date >= date_trunc('month', p_date)::date
      and check_out is not null
    group by member_email, member_name
  )
  select jsonb_build_object(
    'date',       p_date,
    'today',      coalesce((select jsonb_agg(jsonb_build_object(
                    'id',            id,
                    'member_email',  member_email,
                    'member_name',   member_name,
                    'check_in',      check_in,
                    'check_out',     check_out,
                    'duration_mins', duration_mins,
                    'work_notes',    work_notes
                  ) order by check_in desc) from today_logs), '[]'),
    'online_now', coalesce((select jsonb_agg(jsonb_build_object(
                    'member_email', member_email,
                    'member_name',  member_name,
                    'check_in',     check_in
                  )) from currently_online), '[]'),
    'monthly',    coalesce((select jsonb_agg(jsonb_build_object(
                    'member_email',    member_email,
                    'member_name',     member_name,
                    'days_present',    days_present,
                    'total_mins',      total_mins,
                    'avg_mins_per_day',avg_mins_per_day
                  ) order by days_present desc) from monthly_summary), '[]')
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.attendance_overview(date) from public;
grant execute on function public.attendance_overview(date) to authenticated, service_role;

-- ── 4. get_my_active_session() ───────────────────────────────
create or replace function public.get_my_active_session()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_email text;
  v_row   record;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return null; end if;

  select id, check_in, work_notes into v_row
    from public.attendance_logs
    where lower(member_email) = lower(v_email)
      and date = current_date
      and check_out is null
    order by check_in desc
    limit 1;

  if not found then return null; end if;

  return jsonb_build_object(
    'id',         v_row.id,
    'check_in',   v_row.check_in,
    'work_notes', v_row.work_notes
  );
end;
$$;

revoke all on function public.get_my_active_session() from public;
grant execute on function public.get_my_active_session() to authenticated, service_role;
