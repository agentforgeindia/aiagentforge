-- ============================================================
-- AgentForge — Automation Center
-- Run this in Supabase SQL Editor.
-- ============================================================

create table if not exists public.automation_rules (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  trigger_event text not null check (trigger_event in (
    'lead_created','demo_done','payment_success','credits_low',
    'plan_expiring','signup','support_ticket','task_overdue','manual'
  )),
  conditions  jsonb not null default '[]',
  actions     jsonb not null default '[]',
  enabled     boolean not null default true,
  run_count   int not null default 0,
  last_run_at timestamptz,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.automation_rules enable row level security;
drop policy if exists "automation read"  on public.automation_rules;
drop policy if exists "automation write" on public.automation_rules;
create policy "automation read"  on public.automation_rules for select to authenticated using (public.has_permission('settings.view'));
create policy "automation write" on public.automation_rules for all    to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

-- Seed example rules
insert into public.automation_rules (name, trigger_event, conditions, actions, enabled) values
(
  'Assign new lead to Niranjan',
  'lead_created',
  '[]'::jsonb,
  '[{"type":"assign_lead","value":"niranjan@agentforge.in"},{"type":"create_task","value":"Follow up within 1 hour"}]'::jsonb,
  false
),
(
  'Send welcome email on signup',
  'signup',
  '[]'::jsonb,
  '[{"type":"send_email","template":"welcome"}]'::jsonb,
  true
),
(
  'Create followup task after demo',
  'demo_done',
  '[]'::jsonb,
  '[{"type":"create_task","value":"Send proposal within 24h"},{"type":"update_lead_status","value":"trial"}]'::jsonb,
  false
),
(
  'Send invoice on payment success',
  'payment_success',
  '[]'::jsonb,
  '[{"type":"send_email","template":"payment_receipt"}]'::jsonb,
  true
),
(
  'Alert when credits below 100',
  'credits_low',
  '[{"field":"credits","op":"lt","value":100}]'::jsonb,
  '[{"type":"notify_admin","message":"Customer running low on credits"}]'::jsonb,
  false
)
on conflict do nothing;

update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['automation.view','automation.manage'])), updated_at = now()
 where id = 'founder';
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['automation.view'])), updated_at = now()
 where id = 'admin';
