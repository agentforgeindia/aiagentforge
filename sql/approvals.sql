-- ============================================================
-- AgentForge — Internal Approval System
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Team raises requests (discount, refund, expense, credit grant),
-- managers/founder approve or reject.
-- ============================================================

create table if not exists public.approval_requests (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('discount','refund','expense','credit_grant','other')),
  title         text not null,
  amount_inr    numeric(12,2),
  details       text,
  requested_by  text not null,                   -- email
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by    text,
  decided_at    timestamptz,
  decision_note text,
  created_at    timestamptz not null default now()
);

create index if not exists approvals_status_idx on public.approval_requests (status, created_at desc);

alter table public.approval_requests enable row level security;

-- Any admin can read + create requests; deciding needs approvals.decide.
drop policy if exists "approvals read"   on public.approval_requests;
drop policy if exists "approvals insert" on public.approval_requests;
drop policy if exists "approvals decide" on public.approval_requests;

create policy "approvals read"
  on public.approval_requests for select to authenticated
  using (public.is_admin());

create policy "approvals insert"
  on public.approval_requests for insert to authenticated
  with check (public.is_admin());

create policy "approvals decide"
  on public.approval_requests for update to authenticated
  using (public.has_permission('approvals.decide') or public.has_permission('*'))
  with check (public.has_permission('approvals.decide') or public.has_permission('*'));

-- ── Permissions ──────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['approvals.view','approvals.decide'])), updated_at = now()
 where id = 'founder';
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['approvals.view','approvals.decide'])), updated_at = now()
 where id in ('admin','sales_manager');
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['approvals.view'])), updated_at = now()
 where id in ('sales','accounts','support');
