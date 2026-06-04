-- ============================================================
-- AgentForge — Deals Module
-- Run this in Supabase SQL Editor.
-- ============================================================

create table if not exists public.deals (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  company       text,
  contact_name  text,
  contact_email text,
  contact_phone text,
  value_inr     numeric(12,2) not null default 0,
  stage         text not null default 'prospecting' check (stage in (
    'prospecting','qualification','proposal','negotiation','closed_won','closed_lost'
  )),
  probability   int not null default 20 check (probability between 0 and 100),
  assigned_to   text,
  close_date    date,
  source        text,
  notes         text,
  lead_id       uuid references public.leads(id) on delete set null,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists deals_stage_idx      on public.deals (stage, updated_at desc);
create index if not exists deals_assigned_idx   on public.deals (assigned_to, stage);
create index if not exists deals_close_date_idx on public.deals (close_date);

alter table public.deals enable row level security;
drop policy if exists "deals read"  on public.deals;
drop policy if exists "deals write" on public.deals;
create policy "deals read"  on public.deals for select to authenticated using (public.has_permission('leads.view'));
create policy "deals write" on public.deals for all    to authenticated using (public.has_permission('leads.add')) with check (public.has_permission('leads.add'));

update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['deals.view','deals.manage'])), updated_at = now()
 where id in ('founder','admin');
