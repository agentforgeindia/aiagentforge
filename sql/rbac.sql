-- ============================================================
-- AgentForge — Role-Based Access Control (RBAC) + Audit log
-- Run this in Supabase SQL Editor.
-- ============================================================
-- What it sets up:
--   1. admin_roles            — catalogue of roles + their
--                               permission lists.
--   2. admin_users (extended) — role, active flag, last_login,
--                               created_by.
--   3. admin_audit            — sensitive-action ledger.
--   4. Helper functions:
--        current_user_role()        → text
--        current_user_permissions() → text[]
--        has_permission(perm)       → boolean
--        log_admin_action(...)      → uuid
--   5. Seeds 4 default roles + flips existing 2 admin emails
--      to 'founder'.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  admin_roles
-- ────────────────────────────────────────────────────────────
-- permissions is a flat array of dotted strings, e.g.
--   'customers.view', 'leads.add', 'invoices.refund',
--   '*' for the founder catch-all.
-- New permissions are introduced just by referencing them in
-- has_permission() calls — no schema change needed.
-- ────────────────────────────────────────────────────────────

create table if not exists public.admin_roles (
  id           text primary key,           -- 'founder' | 'admin' | 'accounts' | 'sales' | ...
  label        text not null,
  description  text,
  permissions  text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 2.  Extend admin_users
-- ────────────────────────────────────────────────────────────

alter table public.admin_users
  add column if not exists role           text references public.admin_roles(id),
  add column if not exists active         boolean not null default true,
  add column if not exists full_name      text,
  add column if not exists created_by     uuid references auth.users(id) on delete set null,
  add column if not exists last_login_at  timestamptz;

create index if not exists admin_users_role_idx on public.admin_users (role);

-- ────────────────────────────────────────────────────────────
-- 3.  Seed default roles
-- ────────────────────────────────────────────────────────────
-- Permissions taxonomy:
--   customers.view         customers.edit_notes      customers.manual_payment
--   leads.view             leads.add                 leads.edit
--   leads.delete           leads.assign              leads.export
--   invoices.view_all      invoices.download         invoices.refund
--   payments.view_all      payments.manual_entry
--   credits.grant          credits.deduct
--   content.view           content.publish           content.delete
--   testimonials.manage
--   team.view              team.add                  team.edit_role
--   team.deactivate
--   audit.view
--   system.edit_pricing    system.edit_settings
--   '*' = wildcard, founder only
-- ────────────────────────────────────────────────────────────

insert into public.admin_roles (id, label, description, permissions) values
  ('founder', 'Founder', 'Full unrestricted access to the entire console.',
    ARRAY['*']),
  ('admin', 'Admin', 'Operates the whole platform except team management.',
    ARRAY[
      'customers.view','customers.edit_notes','customers.manual_payment',
      'leads.view','leads.add','leads.edit','leads.delete','leads.assign','leads.export',
      'invoices.view_all','invoices.download','invoices.refund',
      'payments.view_all','payments.manual_entry',
      'credits.grant','credits.deduct',
      'content.view','content.publish','content.delete',
      'testimonials.manage',
      'audit.view'
    ]),
  ('accounts', 'Accounts', 'Billing, invoices, refunds, manual payment entry.',
    ARRAY[
      'customers.view',
      'invoices.view_all','invoices.download','invoices.refund',
      'payments.view_all','payments.manual_entry',
      'credits.grant'
    ]),
  ('sales', 'Sales', 'Lead pipeline + customer notes. No billing.',
    ARRAY[
      'customers.view','customers.edit_notes',
      'leads.view','leads.add','leads.edit','leads.assign','leads.export'
    ]),
  ('head_dept', 'Head of Departments', 'Senior head — oversees every department + team, no founder-only system controls.',
    ARRAY[
      'dashboard.view',
      'customers.view','customers.edit_notes',
      'leads.view','leads.add','leads.edit','leads.assign','leads.export',
      'tasks.view','email.view','marketing.view','affiliates.view',
      'invoices.view_all','invoices.download','subscriptions.view',
      'credits.view','finance.view',
      'agents.view','ai_ops.view','ai_costs.view',
      'support.view','approvals.view',
      'team.view','incentives.view','hr.view','kb.view',
      'content.view','testimonials.manage','audit.view'
    ]),
  ('manager', 'Manager', 'Department manager — operations + reports, no billing/system/team-role edits.',
    ARRAY[
      'dashboard.view',
      'customers.view','customers.edit_notes',
      'leads.view','leads.add','leads.edit','leads.assign',
      'tasks.view','marketing.view',
      'support.view','approvals.view','incentives.view','kb.view','ai_ops.view'
    ]),
  ('team_lead', 'Team Leader', 'Leads a team — its leads, customers and tasks. No billing.',
    ARRAY[
      'dashboard.view','customers.view',
      'leads.view','leads.add','leads.edit','leads.assign',
      'tasks.view','support.view','kb.view','incentives.view'
    ]),
  ('sales_head', 'Sales Head', 'Owns the full sales pipeline and team targets.',
    ARRAY[
      'dashboard.view','customers.view','customers.edit_notes',
      'leads.view','leads.add','leads.edit','leads.delete','leads.assign','leads.export',
      'tasks.view','incentives.view','kb.view','support.view'
    ]),
  ('support_head', 'Support Head', 'Owns customer support — tickets, refunds, approvals.',
    ARRAY[
      'dashboard.view','support.view','approvals.view',
      'customers.view','customers.edit_notes','kb.view'
    ]),
  ('marketing_head', 'Marketing Head', 'Owns marketing — campaigns, email, analytics, affiliates.',
    ARRAY[
      'dashboard.view','marketing.view','email.view','affiliates.view','kb.view'
    ]),
  ('hr_head', 'HR Head', 'Owns people ops — HR, hiring, attendance, knowledge base.',
    ARRAY[
      'dashboard.view','hr.view','team.view','kb.view'
    ])
on conflict (id) do update
  set label = excluded.label,
      description = excluded.description,
      permissions = excluded.permissions,
      updated_at = now();

-- Existing admins (from sql/posts.sql seed) become founders.
update public.admin_users
   set role = 'founder'
 where role is null
   and email in ('info@aiagentforge.in', 'info.agentforge@gmail.com');

-- ────────────────────────────────────────────────────────────
-- 4.  Helper functions
-- ────────────────────────────────────────────────────────────

-- Returns the role id for the current auth user, or NULL.
create or replace function public.current_user_role()
returns text
language sql stable security definer set search_path = public
as $$
  select au.role
    from public.admin_users au
    join auth.users u on lower(u.email) = lower(au.email)
   where u.id = auth.uid()
     and au.active = true
   limit 1;
$$;

-- Returns the array of permissions for the current auth user.
create or replace function public.current_user_permissions()
returns text[]
language sql stable security definer set search_path = public
as $$
  select coalesce(r.permissions, '{}')
    from public.admin_users au
    join auth.users u on lower(u.email) = lower(au.email)
    join public.admin_roles r on r.id = au.role
   where u.id = auth.uid()
     and au.active = true
   limit 1;
$$;

-- Checks if the current user has the named permission. Treats
-- '*' as a wildcard match (founder).
create or replace function public.has_permission(p_perm text)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  v_perms text[];
  v_prefix text;
begin
  v_perms := public.current_user_permissions();
  if v_perms is null then return false; end if;
  if '*' = any(v_perms) then return true; end if;
  if p_perm = any(v_perms) then return true; end if;

  -- Wildcard on prefix, e.g. permission 'leads.*' grants any
  -- 'leads.xxx' check.
  v_prefix := split_part(p_perm, '.', 1) || '.*';
  if v_prefix = any(v_perms) then return true; end if;

  return false;
end;
$$;

-- Update is_admin() to use the new model so existing policies
-- continue to work for any signed-in admin (active row).
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(
    select 1
      from public.admin_users au
      join auth.users u on lower(u.email) = lower(au.email)
     where u.id = auth.uid()
       and au.active = true
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 5.  Audit log
-- ────────────────────────────────────────────────────────────

create table if not exists public.admin_audit (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email   text,
  action        text not null,             -- 'refund', 'role_change', 'manual_payment', ...
  target_type   text,                       -- 'user', 'payment', 'lead', 'role', etc.
  target_id     text,
  details       jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists admin_audit_created_idx on public.admin_audit (created_at desc);
create index if not exists admin_audit_action_idx  on public.admin_audit (action, created_at desc);
create index if not exists admin_audit_target_idx  on public.admin_audit (target_type, target_id);

-- Logger that fills in actor automatically from auth.uid().
create or replace function public.log_admin_action(
  p_action      text,
  p_target_type text default null,
  p_target_id   text default null,
  p_details     jsonb default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_email text;
begin
  select u.email into v_email from auth.users u where u.id = auth.uid();
  insert into public.admin_audit(actor_user_id, actor_email, action, target_type, target_id, details)
    values (auth.uid(), v_email, p_action, p_target_type, p_target_id, p_details)
    returning id into v_id;
  return v_id;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 6.  RLS
-- ────────────────────────────────────────────────────────────

alter table public.admin_roles enable row level security;
alter table public.admin_audit enable row level security;

drop policy if exists "admin_roles read by admins" on public.admin_roles;
create policy "admin_roles read by admins"
  on public.admin_roles for select to authenticated
  using (public.is_admin());

drop policy if exists "admin_roles write founder only" on public.admin_roles;
create policy "admin_roles write founder only"
  on public.admin_roles for all to authenticated
  using (public.has_permission('team.edit_role'))
  with check (public.has_permission('team.edit_role'));

drop policy if exists "admin_audit read by admins" on public.admin_audit;
create policy "admin_audit read by admins"
  on public.admin_audit for select to authenticated
  using (public.has_permission('audit.view'));

-- Admin_users — extended policies so founder/admin with team perms
-- can write. The existing 'admin_users admin read' from posts.sql
-- stays.
drop policy if exists "admin_users write by team" on public.admin_users;
create policy "admin_users write by team"
  on public.admin_users for all to authenticated
  using (public.has_permission('team.add'))
  with check (public.has_permission('team.add'));

-- Grant explicit team.* perms to founder (already covered by '*').
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['team.view','team.add','team.edit_role','team.deactivate','audit.view']))
 where id = 'admin';
-- (admin gets team.view but founder owns team.add/edit/deactivate via '*'.)
-- Actually scope: admin should NOT manage team. Strip those except team.view.
update public.admin_roles
   set permissions = array(
     select p from unnest(permissions) p
     where p not in ('team.add','team.edit_role','team.deactivate')
   )
 where id = 'admin';

-- Restrict EXECUTE on helpers to authenticated roles.
revoke all on function public.current_user_role()        from public;
revoke all on function public.current_user_permissions() from public;
revoke all on function public.has_permission(text)       from public;
revoke all on function public.log_admin_action(text, text, text, jsonb) from public;
grant execute on function public.current_user_role()        to authenticated, service_role;
grant execute on function public.current_user_permissions() to authenticated, service_role;
grant execute on function public.has_permission(text)       to authenticated, service_role;
grant execute on function public.log_admin_action(text, text, text, jsonb) to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- select id, label, array_length(permissions, 1) as perm_count
--   from public.admin_roles order by id;
-- select email, role, active from public.admin_users;
-- select public.has_permission('invoices.view_all'); -- run as logged-in admin
-- ============================================================
