-- ============================================================
-- AgentForge — Tasks module (Phase 1)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- One table:
--   public.tasks — work items assigned to team members, optionally
--                  linked to a lead or customer record.
--
-- Permissions:
--   tasks.view, tasks.create, tasks.edit, tasks.assign,
--   tasks.delete  — added to founder/admin/sales/accounts roles.
-- ============================================================

create table if not exists public.tasks (
  id                  uuid primary key default gen_random_uuid(),

  title               text not null,
  description         text,
  type                text not null default 'general'
                      check (type in (
                        'general',
                        'follow_up',
                        'call',
                        'demo',
                        'payment_reminder',
                        'content',
                        'onboarding',
                        'refund'
                      )),

  status              text not null default 'pending'
                      check (status in (
                        'pending',
                        'in_progress',
                        'completed',
                        'cancelled'
                      )),
  priority            text not null default 'normal'
                      check (priority in ('low', 'normal', 'high', 'urgent')),

  -- Whom + when
  assigned_to_email   text,                                    -- admin_users.email
  due_at              timestamptz,
  completed_at        timestamptz,

  -- Optional links — a task usually belongs to either a lead or
  -- a customer (not both). NULLs allowed.
  related_lead_id        uuid references public.leads(id) on delete set null,
  related_customer_id    uuid references auth.users(id) on delete set null,

  -- Audit
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists tasks_status_idx       on public.tasks (status, due_at);
create index if not exists tasks_assignee_idx     on public.tasks (assigned_to_email, status);
create index if not exists tasks_lead_idx         on public.tasks (related_lead_id)     where related_lead_id is not null;
create index if not exists tasks_customer_idx     on public.tasks (related_customer_id) where related_customer_id is not null;
create index if not exists tasks_due_idx          on public.tasks (due_at)              where due_at is not null and status in ('pending','in_progress');

-- updated_at auto-touch
create or replace function public.tasks_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  -- When status flips to completed, stamp completed_at.
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    new.completed_at = now();
  end if;
  -- When un-completing, clear it.
  if new.status <> 'completed' and old.status = 'completed' then
    new.completed_at = null;
  end if;
  return new;
end$$;

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.tasks_touch_updated_at();

-- ────────────────────────────────────────────────────────────
-- RLS — uses has_permission() helpers from sql/rbac.sql
-- ────────────────────────────────────────────────────────────
alter table public.tasks enable row level security;

drop policy if exists "tasks read by viewers" on public.tasks;
create policy "tasks read by viewers"
  on public.tasks
  for select to authenticated
  using (public.has_permission('tasks.view'));

drop policy if exists "tasks create" on public.tasks;
create policy "tasks create"
  on public.tasks
  for insert to authenticated
  with check (public.has_permission('tasks.create'));

drop policy if exists "tasks update" on public.tasks;
create policy "tasks update"
  on public.tasks
  for update to authenticated
  using (public.has_permission('tasks.edit'))
  with check (public.has_permission('tasks.edit'));

drop policy if exists "tasks delete" on public.tasks;
create policy "tasks delete"
  on public.tasks
  for delete to authenticated
  using (public.has_permission('tasks.delete'));

-- ────────────────────────────────────────────────────────────
-- Add new permissions to existing roles
-- ────────────────────────────────────────────────────────────
-- Founder already has '*' wildcard — no change needed.
-- Admin: full task control.
update public.admin_roles
   set permissions = array(
     select distinct unnest(permissions || ARRAY[
       'tasks.view','tasks.create','tasks.edit','tasks.assign','tasks.delete'
     ])
   ),
   updated_at = now()
 where id = 'admin';

-- Sales: can create + edit own; can view all + complete their own.
update public.admin_roles
   set permissions = array(
     select distinct unnest(permissions || ARRAY[
       'tasks.view','tasks.create','tasks.edit'
     ])
   ),
   updated_at = now()
 where id = 'sales';

-- Accounts: same scope as sales for tasks (payment reminders, etc.)
update public.admin_roles
   set permissions = array(
     select distinct unnest(permissions || ARRAY[
       'tasks.view','tasks.create','tasks.edit'
     ])
   ),
   updated_at = now()
 where id = 'accounts';

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- select id, label, permissions from public.admin_roles;
-- select count(*) from public.tasks;
-- ============================================================
