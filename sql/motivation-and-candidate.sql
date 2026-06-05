-- ============================================================
-- AgentForge — Morning Motivation (DOB) + Candidate full details
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── 1. Birthday support for team members ─────────────────────
alter table public.hr_employees
  add column if not exists dob date;

-- Optional: store dob on admin_users too (for members not in HR)
alter table public.admin_users
  add column if not exists dob date;

-- Motivation toggle (founder can turn off)
insert into public.system_settings (key, value, label, category)
values ('motivation.enabled', 'true', 'Morning Motivation', 'notifications')
on conflict (key) do nothing;

-- ── 2. Candidate complete details ────────────────────────────
alter table public.candidates
  add column if not exists dob              date,
  add column if not exists gender           text,
  add column if not exists marital_status   text,
  add column if not exists qualification    text,
  add column if not exists experience_years numeric(4,1),
  add column if not exists languages        text,
  add column if not exists current_company  text;

-- ── 3. motivation_context() — what the AI needs about a member ─
create or replace function public.motivation_context()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_email text;
  v_m_start date := date_trunc('month', current_date)::date;
  v_sales int := 0;
  v_is_bday boolean := false;
  v_is_daily boolean := false;
  v_is_weekly boolean := false;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return jsonb_build_object('error','not logged in'); end if;

  -- Sales this month (converted leads assigned to them)
  begin
    select count(*) into v_sales from public.leads
     where lower(assigned_to)=lower(v_email) and status='converted' and updated_at::date >= v_m_start;
  exception when undefined_column then v_sales := 0; end;

  -- Birthday?
  begin
    select exists(
      select 1 from public.hr_employees where lower(email)=lower(v_email)
        and dob is not null and to_char(dob,'MM-DD') = to_char(current_date,'MM-DD')
      union
      select 1 from public.admin_users where lower(email)=lower(v_email)
        and dob is not null and to_char(dob,'MM-DD') = to_char(current_date,'MM-DD')
    ) into v_is_bday;
  exception when undefined_column then v_is_bday := false; end;

  -- Daily top achiever = most converts today is this member?
  begin
    select lower(coalesce((
      select assigned_to from public.leads
       where status='converted' and updated_at::date = current_date and assigned_to is not null
       group by assigned_to order by count(*) desc limit 1
    ),'')) = lower(v_email) into v_is_daily;
  exception when others then v_is_daily := false; end;

  return jsonb_build_object(
    'name', split_part(v_email,'@',1),
    'sales_month', v_sales,
    'is_birthday', v_is_bday,
    'is_daily_achiever', coalesce(v_is_daily,false),
    'role', public.current_user_role()
  );
exception when others then
  return jsonb_build_object('name', 'team', 'sales_month', 0, 'is_birthday', false);
end$$;

revoke all on function public.motivation_context() from public;
grant execute on function public.motivation_context() to authenticated, service_role;
