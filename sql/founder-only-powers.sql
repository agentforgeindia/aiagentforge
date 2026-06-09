-- ============================================================
-- AgentForge — Founder-only powers (curate the Admin role)
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- Founder ('*') sees every module. The Admin role is curated to all the
-- day-to-day OPERATIONAL modules, but the sensitive ones are removed so
-- they stay FOUNDER-ONLY:
--   • Finance (revenue/profit/expenses)        — finance.view
--   • AI Costs (margins/API spend)             — ai_costs.view
--   • Settings / Integrations / Automation     — settings.view
--   • Team & role management                   — team.view / team.*
--   • Audit Log / Error Logs                   — audit.view
--   • Influencer Withdrawals (payouts)         — finance.view (tile re-perm)
--   • Command Center (founder cockpit)         — '*' (tile re-perm)
--   • Role Access                              — '*'
-- These perms are intentionally NOT granted to admin below.
-- ============================================================

update public.admin_roles
set permissions = ARRAY[
  -- Command (War Room only; Command Center is founder-only)
  'dashboard.view',
  -- Sales & CRM
  'customers.view','customers.edit_notes','customers.manual_payment',
  'leads.view','leads.add','leads.edit','leads.delete','leads.assign','leads.export',
  'tasks.view',
  -- Marketing (Marketing, Analytics, Affiliates, Influencer Hub)
  'email.view','marketing.view','affiliates.view',
  -- Finance (view-only billing; NOT finance.view, NOT refunds/manual entry)
  'invoices.view_all','invoices.download',
  'subscriptions.view',
  'credits.view','credits.grant','credits.deduct',
  'payments.view_all',
  -- AI (operational; NOT ai_costs.view)
  'agents.view','ai_ops.view',
  -- Support
  'support.view','approvals.view',
  -- People & Hiring (operational)
  'hr.view','incentives.view','kb.view',
  -- Content
  'content.view','content.publish','content.delete','testimonials.manage'
]
where id = 'admin';

-- ── Verify ──────────────────────────────────────────────────
-- select id, label, array_length(permissions,1) as perms from public.admin_roles order by id;
-- Founder = '*' (all). Admin should now be clearly fewer than the founder's
-- module count, with no Finance / AI Costs / Settings / Team / Audit /
-- Withdrawals / Command Center / Role Access access.
-- ============================================================
