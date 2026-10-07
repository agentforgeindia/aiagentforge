// ============================================================
// adminHubs — the cleaned-up admin navigation.
// ============================================================
// The backend had 56 separate sidebar entries, many of them doing
// the same job (3 dashboards, 3 AI chat assistants, 5 workshop
// pages, 5 sales-team pages…). Here they are grouped into hubs:
// one sidebar entry per job, with tabs on top of the page to
// switch between the related screens.
//
// Nothing is deleted — every old URL still works. Modules that
// were dead (no data, event over) are listed in ARCHIVED and only
// reachable from the founder's "Archived" list on the home page.
//
// Every label/description has English (en) and Hinglish (hi).
// ============================================================

import {
  BarChart3,
  Bot,
  CheckSquare,
  CreditCard,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Megaphone,
  BadgeCheck,
  Presentation,
  ScrollText,
  Settings,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  Zap,
  Handshake,
  Video,
} from "lucide-react";
import { TILES, type Tile } from "./adminNav";

export type Lang = "en" | "hi";
export type L = { en: string; hi: string };

export type Hub = {
  key: string;
  group: string;
  label: L;
  description: L;
  icon: React.ReactNode;
  /** Member pages, in tab order. First one the user can open is the hub's landing page. */
  tabs: string[];
};

export const HUB_GROUPS: { key: string; label: L }[] = [
  { key: "overview",  label: { en: "Overview",          hi: "Overview" } },
  { key: "sales",     label: { en: "Sales",             hi: "Sales" } },
  { key: "marketing", label: { en: "Marketing",         hi: "Marketing" } },
  { key: "money",     label: { en: "Finance",           hi: "Paisa / Finance" } },
  { key: "ai",        label: { en: "AI",                hi: "AI" } },
  { key: "people",    label: { en: "Team & Support",    hi: "Team aur Support" } },
  { key: "system",    label: { en: "System",            hi: "System" } },
];

const i = "h-4 w-4";

export const HUBS: Hub[] = [
  // ── Overview ──
  { key: "training", group: "overview", icon: <GraduationCap className={i} />,
    label: { en: "Training", hi: "Training" },
    description: { en: "Learn the backend step by step — lessons for your role, with a quick quiz.", hi: "Backend step by step seekho — aapke role ke lessons, chhote quiz ke saath." },
    tabs: ["/admin/training"] },
  { key: "dashboard", group: "overview", icon: <LayoutDashboard className={i} />,
    label: { en: "Dashboards", hi: "Dashboard" },
    description: { en: "Founder cockpit, War Room and CRM numbers in one place.", hi: "Founder cockpit, War Room aur CRM ke numbers ek jagah." },
    tabs: ["/admin/command", "/admin/dashboard", "/admin/crm"] },
  { key: "app-content", group: "overview", icon: <Megaphone className={i} />,
    label: { en: "App Content", hi: "App Content" },
    description: { en: "Banners and offers on the app screens, and notifications (announcements) in every user's bell.", hi: "App ke screen par banner aur offer, aur har user ki bell mein notification (announcement)." },
    tabs: ["/admin/app-content", "/admin/announcements"] },
  { key: "approvals", group: "overview", icon: <BadgeCheck className={i} />,
    label: { en: "Approvals", hi: "Approvals" },
    description: { en: "Discount, refund and expense requests — approve or reject.", hi: "Discount, refund, expense ki requests — approve ya reject karo." },
    tabs: ["/admin/approvals"] },

  // ── Sales ──
  { key: "leads", group: "sales", icon: <UserPlus className={i} />,
    label: { en: "Leads", hi: "Leads" },
    description: { en: "Inbound prospects from ads and outreach.", hi: "Ads aur outreach se aaye naye prospects." },
    tabs: ["/admin/leads"] },
  { key: "customers", group: "sales", icon: <Users className={i} />,
    label: { en: "Customers", hi: "Customers" },
    description: { en: "Signed-up users, plans, balances, notes.", hi: "Signup kiye users — plan, balance, notes." },
    tabs: ["/admin/customers"] },
  { key: "tasks", group: "sales", icon: <CheckSquare className={i} />,
    label: { en: "Tasks", hi: "Tasks" },
    description: { en: "Follow-ups, demos, payment reminders.", hi: "Follow-up, demo, payment reminder — sab kaam yahan." },
    tabs: ["/admin/tasks"] },
  { key: "sales-team", group: "sales", icon: <Trophy className={i} />,
    label: { en: "Sales Floor", hi: "Sales Floor" },
    description: { en: "Calling queue, rankings, caller reports and incentives.", hi: "Calling queue, ranking, caller report aur incentive." },
    tabs: ["/admin/sales", "/admin/sales-room", "/admin/leaderboard", "/admin/caller-reports", "/admin/incentives"] },
  { key: "meetings", group: "sales", icon: <Video className={i} />,
    label: { en: "Meetings & Demos", hi: "Meetings aur Demo" },
    description: { en: "Zoom meetings and customize-demo requests.", hi: "Zoom meetings aur customize demo ki requests." },
    tabs: ["/admin/meetings", "/admin/demo-requests"] },
  { key: "workshop", group: "sales", icon: <Presentation className={i} />,
    label: { en: "Workshop", hi: "Workshop" },
    description: { en: "Registrations, failed payments, certificates, survey, reviews.", hi: "Registration, failed payment, certificate, survey, review." },
    tabs: ["/admin/workshop-registrations", "/admin/workshop-failed", "/admin/workshop-certificates", "/admin/workshop-survey", "/admin/workshop-reviews"] },

  // ── Marketing ──
  { key: "marketing", group: "marketing", icon: <BarChart3 className={i} />,
    label: { en: "Marketing & Analytics", hi: "Marketing aur Analytics" },
    description: { en: "Lead sources, campaigns, Meta/GA4/Clarity, Meta CAPI events.", hi: "Lead source, campaign, Meta/GA4/Clarity, Meta CAPI events." },
    tabs: ["/admin/marketing", "/admin/analytics", "/admin/meta-capi"] },
  { key: "email", group: "marketing", icon: <Mail className={i} />,
    label: { en: "Email", hi: "Email" },
    description: { en: "Templates, automation queue, test sends.", hi: "Email template, automation queue, test send." },
    tabs: ["/admin/email"] },
  { key: "influencers", group: "marketing", icon: <Star className={i} />,
    label: { en: "Influencers", hi: "Influencers" },
    description: { en: "Creator hub, video approvals and payout withdrawals.", hi: "Creator hub, video approval aur payout withdrawal." },
    tabs: ["/admin/influencers", "/admin/influencer-withdrawals"] },
  { key: "affiliates", group: "marketing", icon: <Handshake className={i} />,
    label: { en: "Affiliates", hi: "Affiliates" },
    description: { en: "Referral partners, commissions, payouts.", hi: "Referral partner, commission, payout." },
    tabs: ["/admin/affiliates"] },
  { key: "content", group: "marketing", icon: <FileText className={i} />,
    label: { en: "Content", hi: "Content" },
    description: { en: "Blog/news posts and homepage testimonials.", hi: "Blog/news post aur homepage testimonials." },
    tabs: ["/admin/posts", "/admin/testimonials"] },

  // ── Finance ──
  { key: "finance", group: "money", icon: <Wallet className={i} />,
    label: { en: "Finance", hi: "Finance" },
    description: { en: "Revenue, expenses, hosting, ad spend, net profit.", hi: "Revenue, kharcha, hosting, ad spend, net profit." },
    tabs: ["/admin/finance"] },
  { key: "billing", group: "money", icon: <CreditCard className={i} />,
    label: { en: "Billing", hi: "Billing" },
    description: { en: "Invoices, subscriptions and credit balances.", hi: "Invoice, subscription aur credit balance." },
    tabs: ["/admin/invoices", "/admin/subscriptions", "/admin/credits-center"] },

  // ── AI ──
  { key: "agents", group: "ai", icon: <Bot className={i} />,
    label: { en: "Agents", hi: "Agents" },
    description: { en: "Enable/disable AI agents, credits, prompt version.", hi: "AI agent on/off, credits, prompt version." },
    tabs: ["/admin/agents"] },
  { key: "ai-usage", group: "ai", icon: <Zap className={i} />,
    label: { en: "AI Usage & Costs", hi: "AI Usage aur Cost" },
    description: { en: "Generation volume, failures, every generation, API spend.", hi: "Kitni generation, failure, har generation ka record, API kharcha." },
    tabs: ["/admin/ai-operations", "/admin/generation-log", "/admin/ai-costs"] },
  { key: "assistants", group: "ai", icon: <Sparkles className={i} />,
    label: { en: "AI Assistants", hi: "AI Assistant" },
    description: { en: "Caller GPT, team helper and meeting/WhatsApp drafts.", hi: "Caller GPT, team helper, meeting/WhatsApp ke draft." },
    tabs: ["/admin/caller-gpt", "/admin/team-assistant", "/admin/ai-assistant"] },

  // ── Team & Support ──
  { key: "support", group: "people", icon: <LifeBuoy className={i} />,
    label: { en: "Support", hi: "Support" },
    description: { en: "Tickets, WhatsApp inbox, refunds & disputes.", hi: "Ticket, WhatsApp inbox, refund aur dispute." },
    tabs: ["/admin/support-center", "/admin/whatsapp", "/admin/refunds-center"] },
  { key: "team", group: "people", icon: <Users className={i} />,
    label: { en: "Team", hi: "Team" },
    description: { en: "Admins & roles, attendance, role access, HR.", hi: "Admin aur role, attendance, role access, HR." },
    tabs: ["/admin/team", "/admin/team/attendance", "/admin/role-access", "/admin/hr"] },
  { key: "hiring", group: "people", icon: <GraduationCap className={i} />,
    label: { en: "Hiring", hi: "Hiring" },
    description: { en: "Hiring OS pipeline and Learn & Earn Academy.", hi: "Hiring OS pipeline aur Learn & Earn Academy." },
    tabs: ["/admin/recruitment", "/admin/academy"] },
  { key: "help", group: "people", icon: <HelpCircle className={i} />,
    label: { en: "Help & Resources", hi: "Help aur Resources" },
    description: { en: "Role rules, knowledge base, WhatsApp templates & links.", hi: "Role ke rules, knowledge base, WhatsApp template aur links." },
    tabs: ["/admin/help", "/admin/knowledge-base", "/admin/templates"] },

  // ── System ──
  { key: "settings", group: "system", icon: <Settings className={i} />,
    label: { en: "Settings", hi: "Settings" },
    description: { en: "Company settings, integrations, automation rules.", hi: "Company setting, integrations, automation rules." },
    tabs: ["/admin/settings", "/admin/integrations", "/admin/automation"] },
  { key: "logs", group: "system", icon: <ScrollText className={i} />,
    label: { en: "Logs", hi: "Logs" },
    description: { en: "System errors and the audit trail of sensitive actions.", hi: "System errors aur sensitive actions ka audit record." },
    tabs: ["/admin/error-logs", "/admin/audit"] },
];

/** Hidden from navigation (no data / event over). URLs still work. */
export const ARCHIVED: { href: string; label: L; reason: L }[] = [
  { href: "/admin/deals", label: { en: "Deals", hi: "Deals" },
    reason: { en: "Never used (0 deals) — Leads pipeline does this job.", hi: "Kabhi use nahi hua (0 deals) — ye kaam Leads pipeline karta hai." } },
  { href: "/admin/onsite-training", label: { en: "On-Site Training", hi: "On-Site Training" },
    reason: { en: "July 2026 event is over, 0 bookings.", hi: "July 2026 ka event khatam, 0 booking." } },
];

/** Short tab labels (fallback: the module's own label). */
const TAB_LABEL: Record<string, L> = {
  "/admin/command": { en: "Founder", hi: "Founder" },
  "/admin/dashboard": { en: "War Room", hi: "War Room" },
  "/admin/crm": { en: "CRM", hi: "CRM" },
  "/admin/app-content": { en: "Banners & Offers", hi: "Banner aur Offer" },
  "/admin/announcements": { en: "Notifications", hi: "Notifications" },
  "/admin/sales": { en: "Calling Queue", hi: "Calling Queue" },
  "/admin/sales-room": { en: "Sales Room", hi: "Sales Room" },
  "/admin/leaderboard": { en: "Leaderboard", hi: "Leaderboard" },
  "/admin/caller-reports": { en: "Caller Reports", hi: "Caller Report" },
  "/admin/incentives": { en: "Incentives", hi: "Incentive" },
  "/admin/meetings": { en: "Meetings", hi: "Meetings" },
  "/admin/demo-requests": { en: "Demo Requests", hi: "Demo Requests" },
  "/admin/workshop-registrations": { en: "Registrations", hi: "Registration" },
  "/admin/workshop-failed": { en: "Failed Payments", hi: "Failed Payment" },
  "/admin/workshop-certificates": { en: "Certificates", hi: "Certificate" },
  "/admin/workshop-survey": { en: "Survey", hi: "Survey" },
  "/admin/workshop-reviews": { en: "Reviews", hi: "Reviews" },
  "/admin/marketing": { en: "Lead Sources", hi: "Lead Source" },
  "/admin/analytics": { en: "Analytics", hi: "Analytics" },
  "/admin/meta-capi": { en: "Meta CAPI", hi: "Meta CAPI" },
  "/admin/influencers": { en: "Creators", hi: "Creators" },
  "/admin/influencer-withdrawals": { en: "Withdrawals", hi: "Withdrawal" },
  "/admin/posts": { en: "Posts", hi: "Posts" },
  "/admin/testimonials": { en: "Testimonials", hi: "Testimonials" },
  "/admin/invoices": { en: "Invoices", hi: "Invoice" },
  "/admin/subscriptions": { en: "Subscriptions", hi: "Subscription" },
  "/admin/credits-center": { en: "Credits", hi: "Credits" },
  "/admin/ai-operations": { en: "Overview", hi: "Overview" },
  "/admin/generation-log": { en: "Generation Log", hi: "Generation Log" },
  "/admin/ai-costs": { en: "Costs", hi: "Cost" },
  "/admin/caller-gpt": { en: "Caller GPT", hi: "Caller GPT" },
  "/admin/team-assistant": { en: "Team Assistant", hi: "Team Assistant" },
  "/admin/ai-assistant": { en: "Drafts & Coaching", hi: "Draft aur Coaching" },
  "/admin/support-center": { en: "Tickets", hi: "Tickets" },
  "/admin/whatsapp": { en: "WhatsApp", hi: "WhatsApp" },
  "/admin/refunds-center": { en: "Refunds", hi: "Refund" },
  "/admin/team": { en: "Members", hi: "Members" },
  "/admin/team/attendance": { en: "Attendance", hi: "Attendance" },
  "/admin/role-access": { en: "Role Access", hi: "Role Access" },
  "/admin/hr": { en: "HR", hi: "HR" },
  "/admin/recruitment": { en: "Hiring OS", hi: "Hiring OS" },
  "/admin/academy": { en: "Academy", hi: "Academy" },
  "/admin/help": { en: "Rules & Help", hi: "Rules aur Help" },
  "/admin/knowledge-base": { en: "Knowledge Base", hi: "Knowledge Base" },
  "/admin/templates": { en: "Templates & Links", hi: "Template aur Links" },
  "/admin/settings": { en: "General", hi: "General" },
  "/admin/integrations": { en: "Integrations", hi: "Integrations" },
  "/admin/automation": { en: "Automation", hi: "Automation" },
  "/admin/error-logs": { en: "Errors", hi: "Errors" },
  "/admin/audit": { en: "Audit Log", hi: "Audit Log" },
};

// Pages that aren't in TILES (no own sidebar entry before) still need a permission.
const EXTRA_PERM: Record<string, string> = {
  "/admin/training": "any",
  "/admin/workshop-failed": "customers.view",
};

const tileByHref = new Map<string, Tile>(TILES.map((t) => [t.href, t]));

export function permFor(href: string): string {
  return tileByHref.get(href)?.perm ?? EXTRA_PERM[href] ?? "*";
}

export function tabLabel(href: string, lang: Lang): string {
  return TAB_LABEL[href]?.[lang] ?? tileByHref.get(href)?.label ?? href;
}

/** Tabs of a hub the user may open. */
export function visibleTabs(hub: Hub, has: (p: string) => boolean): string[] {
  return hub.tabs.filter((h) => has(permFor(h)));
}

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Which hub + tab does this URL belong to (most specific tab wins). */
export function locate(pathname: string): { hub: Hub; tab: string } | null {
  let best: { hub: Hub; tab: string } | null = null;
  for (const hub of HUBS) {
    for (const tab of hub.tabs) {
      if (matches(pathname, tab) && (!best || tab.length > best.tab.length)) {
        best = { hub, tab };
      }
    }
  }
  return best;
}

export function hubByKey(key: string) {
  return HUBS.find((h) => h.key === key);
}
