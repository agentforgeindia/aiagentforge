-- ============================================================
-- AgentForge — Additional Roles (Support, Social Media, Sales Manager)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Adds 3 new roles on top of the existing founder/admin/accounts/sales.
-- Permissions use the same dotted taxonomy as rbac.sql + all the
-- module permissions added across the build (support.*, marketing.*,
-- content.*, deals.*, incentives.*, kb.*, etc.).
-- ============================================================

insert into public.admin_roles (id, label, description, permissions) values

  ('support', 'Support', 'Customer support — tickets, WhatsApp inbox, customer lookup.',
    ARRAY[
      'support.view','support.manage',
      'customers.view',
      'leads.view',
      'kb.view',
      'credits.grant'                       -- can compensate credits on issues
    ]),

  ('social', 'Social Media', 'Content, news, testimonials and marketing.',
    ARRAY[
      'content.view','content.publish','content.delete',
      'testimonials.manage',
      'marketing.view',
      'kb.view'
    ]),

  ('sales_manager', 'Sales Manager', 'Runs the sales team — leads, deals, incentives, targets, billing view.',
    ARRAY[
      'dashboard.view',
      'customers.view','customers.edit_notes',
      'leads.view','leads.add','leads.edit','leads.delete','leads.assign','leads.export',
      'deals.view','deals.manage',
      'tasks.view',
      'incentives.view',
      'invoices.view_all',
      'team.view',
      'kb.view'
    ])

on conflict (id) do update
  set label = excluded.label,
      description = excluded.description,
      permissions = excluded.permissions,
      updated_at = now();

-- Verification:
-- select id, label, array_length(permissions,1) as perms from public.admin_roles order by id;
