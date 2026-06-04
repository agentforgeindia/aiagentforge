-- ============================================================
-- AgentForge — HR Module
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── Employees ────────────────────────────────────────────────
create table if not exists public.hr_employees (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  full_name    text not null,
  role         text not null default 'sales',
  department   text,
  joining_date date,
  base_salary  numeric(10,2) not null default 0,
  status       text not null default 'active' check (status in ('active','inactive','resigned')),
  phone        text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Salary records ────────────────────────────────────────────
create table if not exists public.hr_salary_records (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.hr_employees(id) on delete cascade,
  month         date not null,
  base_salary   numeric(10,2) not null default 0,
  incentive     numeric(10,2) not null default 0,
  deductions    numeric(10,2) not null default 0,
  net_salary    numeric(10,2) generated always as (base_salary + incentive - deductions) stored,
  paid          boolean not null default false,
  paid_on       date,
  notes         text,
  created_at    timestamptz not null default now(),
  unique (employee_id, month)
);

-- ── Leave requests ────────────────────────────────────────────
create table if not exists public.hr_leaves (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.hr_employees(id) on delete cascade,
  leave_type   text not null check (leave_type in ('casual','sick','earned','unpaid')),
  from_date    date not null,
  to_date      date not null,
  days         int generated always as (to_date - from_date + 1) stored,
  reason       text,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by  text,
  created_at   timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.hr_employees      enable row level security;
alter table public.hr_salary_records enable row level security;
alter table public.hr_leaves         enable row level security;

drop policy if exists "hr_employees read"       on public.hr_employees;
drop policy if exists "hr_employees write"      on public.hr_employees;
drop policy if exists "hr_salary read"          on public.hr_salary_records;
drop policy if exists "hr_salary write"         on public.hr_salary_records;
drop policy if exists "hr_leaves read"          on public.hr_leaves;
drop policy if exists "hr_leaves write"         on public.hr_leaves;

create policy "hr_employees read"  on public.hr_employees      for select to authenticated using (public.has_permission('hr.view'));
create policy "hr_employees write" on public.hr_employees      for all    to authenticated using (public.has_permission('hr.manage')) with check (public.has_permission('hr.manage'));
create policy "hr_salary read"     on public.hr_salary_records for select to authenticated using (public.has_permission('hr.view'));
create policy "hr_salary write"    on public.hr_salary_records for all    to authenticated using (public.has_permission('hr.manage')) with check (public.has_permission('hr.manage'));
create policy "hr_leaves read"     on public.hr_leaves         for select to authenticated using (public.has_permission('hr.view'));
create policy "hr_leaves write"    on public.hr_leaves         for all    to authenticated using (public.has_permission('hr.manage')) with check (public.has_permission('hr.manage'));

-- ── Permissions ──────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['hr.view','hr.manage'])), updated_at = now()
 where id = 'founder';
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['hr.view'])), updated_at = now()
 where id = 'admin';
