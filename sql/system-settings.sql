-- ============================================================
-- AgentForge — System Settings (Phase 3+)
-- Run this in Supabase SQL Editor.
-- ============================================================

create table if not exists public.system_settings (
  key         text primary key,
  value       jsonb not null default 'null'::jsonb,
  label       text,
  category    text not null default 'general',
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.system_settings enable row level security;

drop policy if exists "system_settings read"  on public.system_settings;
drop policy if exists "system_settings write" on public.system_settings;

create policy "system_settings read"
  on public.system_settings for select to authenticated
  using (public.has_permission('settings.view'));

create policy "system_settings write"
  on public.system_settings for all to authenticated
  using (public.has_permission('settings.manage'))
  with check (public.has_permission('settings.manage'));

-- ── Permissions ─────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'settings.view', 'settings.manage'
   ])), updated_at = now()
 where id = 'founder';

update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'settings.view'
   ])), updated_at = now()
 where id = 'admin';

-- ── Seed default settings ────────────────────────────────────
insert into public.system_settings (key, value, label, category) values
('company.name',        '"AgentForge"',                         'Company Name',        'company'),
('company.gst',         '"27XXXXX"',                            'GST Number',          'company'),
('company.address',     '"Mumbai, Maharashtra, India"',         'Address',             'company'),
('company.support_email', '"support@aiagentforge.in"',          'Support Email',       'company'),
('company.website',     '"https://aiagentforge.in"',            'Website',             'company'),
('plans.starter.credits',  '1800',                              'Starter Credits',     'plans'),
('plans.starter.price',    '1999',                              'Starter Price (INR)', 'plans'),
('plans.pro.credits',      '12000',                             'Pro Credits',         'plans'),
('plans.pro.price',        '9999',                              'Pro Price (INR)',      'plans'),
('plans.empire.credits',   '50000',                             'Empire Credits',      'plans'),
('plans.empire.price',     '39999',                             'Empire Price (INR)',  'plans'),
('credits.free_on_signup', '100',                               'Free Credits on Signup', 'credits'),
('credits.cost_per_image', '15',                                'Credits Per Image',   'credits'),
('notifications.email_enabled', 'true',                         'Email Notifications', 'notifications'),
('notifications.welcome_email', 'true',                         'Welcome Email',       'notifications')
on conflict (key) do nothing;
