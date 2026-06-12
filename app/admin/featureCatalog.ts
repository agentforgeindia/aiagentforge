// ============================================================
// Shared feature catalog — the single source of truth for which
// admin features exist and which permission each one requires.
// Used by the founder Role Access page to show, per role, exactly
// which features that role can see. Keep in sync with the TILES
// list in app/admin/page.tsx.
// ============================================================

export type Feature = { group: string; href: string; label: string; perm: string };

export const GROUP_ORDER = [
  "Command", "Sales & CRM", "Marketing", "Influencers", "Finance",
  "AI", "Support", "People & Hiring", "Content", "System",
];

export const FEATURE_CATALOG: Feature[] = [
  // Command
  { group: "Command", href: "/admin/command",   label: "Command Center", perm: "dashboard.view" },
  { group: "Command", href: "/admin/dashboard", label: "War Room",       perm: "dashboard.view" },
  { group: "Command", href: "/admin/announcements", label: "Announcements", perm: "customers.view" },

  // Sales & CRM
  { group: "Sales & CRM", href: "/admin/customers",      label: "Customers",         perm: "customers.view" },
  { group: "Sales & CRM", href: "/admin/leads",          label: "Leads",             perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/sales",          label: "Sales Command",     perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/caller-reports", label: "Caller Reports",    perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/caller-gpt",     label: "Caller GPT",        perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/sales-room",     label: "Sales War Room",    perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/templates",      label: "Templates & Links", perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/deals",          label: "Deals",             perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/tasks",          label: "Tasks",             perm: "tasks.view" },
  { group: "Sales & CRM", href: "/admin/workshop-registrations", label: "Workshop Registrations", perm: "customers.view" },
  { group: "Sales & CRM", href: "/admin/workshop-certificates", label: "Workshop Certificates", perm: "customers.view" },
  { group: "Sales & CRM", href: "/admin/demo-requests", label: "Demo Requests", perm: "leads.view" },

  // Marketing
  { group: "Marketing", href: "/admin/email",      label: "Email",      perm: "email.view" },
  { group: "Marketing", href: "/admin/marketing",  label: "Marketing",  perm: "marketing.view" },
  { group: "Marketing", href: "/admin/analytics",  label: "Analytics",  perm: "marketing.view" },
  { group: "Marketing", href: "/admin/affiliates", label: "Affiliates", perm: "affiliates.view" },

  // Influencers
  { group: "Influencers", href: "/admin/influencers",            label: "Influencer Hub", perm: "marketing.view" },
  { group: "Influencers", href: "/admin/influencer-withdrawals", label: "Withdrawals",    perm: "marketing.view" },

  // Finance
  { group: "Finance", href: "/admin/invoices",       label: "Invoices",      perm: "invoices.view_all" },
  { group: "Finance", href: "/admin/subscriptions",  label: "Subscriptions", perm: "subscriptions.view" },
  { group: "Finance", href: "/admin/credits-center", label: "Credits",       perm: "credits.view" },
  { group: "Finance", href: "/admin/finance",        label: "Finance",       perm: "finance.view" },

  // AI
  { group: "AI", href: "/admin/agents",         label: "Agents",         perm: "agents.view" },
  { group: "AI", href: "/admin/ai-operations",  label: "AI Operations",  perm: "ai_ops.view" },
  { group: "AI", href: "/admin/generation-log", label: "Generation Log", perm: "ai_ops.view" },
  { group: "AI", href: "/admin/ai-costs",       label: "AI Costs",       perm: "ai_costs.view" },
  { group: "AI", href: "/admin/ai-assistant",   label: "AI Assistant",   perm: "dashboard.view" },

  // Support
  { group: "Support", href: "/admin/support-center", label: "Support",            perm: "support.view" },
  { group: "Support", href: "/admin/whatsapp",       label: "WhatsApp Inbox",     perm: "support.view" },
  { group: "Support", href: "/admin/refunds-center", label: "Refunds & Disputes", perm: "support.view" },
  { group: "Support", href: "/admin/approvals",      label: "Approvals",          perm: "approvals.view" },

  // People & Hiring
  { group: "People & Hiring", href: "/admin/team",            label: "Team",                perm: "team.view" },
  { group: "People & Hiring", href: "/admin/team/attendance", label: "Attendance",          perm: "team.view" },
  { group: "People & Hiring", href: "/admin/incentives",      label: "Incentives",          perm: "incentives.view" },
  { group: "People & Hiring", href: "/admin/leaderboard",     label: "Leaderboard",         perm: "team.view" },
  { group: "People & Hiring", href: "/admin/hr",              label: "HR",                  perm: "hr.view" },
  { group: "People & Hiring", href: "/admin/recruitment",     label: "Hiring OS",           perm: "hr.view" },
  { group: "People & Hiring", href: "/admin/academy",         label: "Learn & Earn Academy", perm: "hr.view" },
  { group: "People & Hiring", href: "/admin/knowledge-base",  label: "Knowledge Base",      perm: "kb.view" },

  // Content
  { group: "Content", href: "/admin/posts",        label: "Content",      perm: "content.view" },
  { group: "Content", href: "/admin/testimonials", label: "Testimonials", perm: "testimonials.manage" },

  // System
  { group: "System", href: "/admin/automation",   label: "Automation",   perm: "settings.view" },
  { group: "System", href: "/admin/integrations", label: "Integrations", perm: "settings.view" },
  { group: "System", href: "/admin/settings",     label: "Settings",     perm: "settings.view" },
  { group: "System", href: "/admin/error-logs",   label: "Error Logs",   perm: "audit.view" },
  { group: "System", href: "/admin/audit",        label: "Audit Log",    perm: "audit.view" },
  { group: "System", href: "/admin/help",         label: "Help & Rules", perm: "leads.view" },
];

// Does a role (its permission array) grant the given feature permission?
// Mirrors matchesPermission() in AdminPermissions.tsx: wildcard, exact, prefix.*
export function roleHasPerm(perm: string, owned: string[] | null | undefined): boolean {
  if (!owned || owned.length === 0) return false;
  if (owned.includes("*")) return true;
  if (owned.includes(perm)) return true;
  return owned.includes(perm.split(".")[0] + ".*");
}
