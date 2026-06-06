"use client";

// ============================================================
// /admin — admin home / hub. Corporate, minimal, no gradients.
// ============================================================

import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  Clock,
  Coins,
  Crosshair,
  FileText,
  Gem,
  GitPullRequest,
  GraduationCap,
  Handshake,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Phone,
  PhoneCall,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Undo2,
  ShieldQuestion,
  Star,
  Target,
  Ticket,
  Trophy,
  UserCog,
  Users,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react";
import AdminShell, { adminCardCls, adminMutedCls } from "./AdminShell";
import { useAdminPermissions } from "./AdminPermissions";

type Tile = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  perm: string;
  group: string;
};

// Display order of category sections.
const GROUP_ORDER = [
  "Command", "Sales & CRM", "Marketing", "Influencers", "Finance",
  "AI", "Support", "People & Hiring", "Content", "System",
];

const TILES: Tile[] = [
  // ── Command ──────────────────────────────────────────────────
  { group: "Command", href: "/admin/command",        label: "Command Center", description: "Founder cockpit — live numbers, goals, cash, team output.", icon: <Crosshair className="h-4 w-4" />,      perm: "dashboard.view" },
  { group: "Command", href: "/admin/dashboard",      label: "War Room",       description: "Revenue, signups, pipeline, alerts — all at a glance.",   icon: <LayoutDashboard className="h-4 w-4" />, perm: "dashboard.view" },

  // ── Sales & CRM ──────────────────────────────────────────────
  { group: "Sales & CRM", href: "/admin/customers",      label: "Customers",      description: "Signed-up users, plans, balances, notes.",                icon: <Users className="h-4 w-4" />,          perm: "customers.view" },
  { group: "Sales & CRM", href: "/admin/leads",          label: "Leads",          description: "Inbound prospects from ads and outreach.",                icon: <UserPlus className="h-4 w-4" />,        perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/sales",          label: "Sales Command",  description: "Calling queue, hot leads, followups, missed leads.",     icon: <Phone className="h-4 w-4" />,           perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/caller-reports", label: "Caller Reports", description: "Daily calling numbers — calls, demos, hot leads, paid.",  icon: <PhoneCall className="h-4 w-4" />,       perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/caller-gpt",     label: "Caller GPT",     description: "Live AI calling assistant — instant objection replies.", icon: <Sparkles className="h-4 w-4" />,        perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/sales-room",     label: "Sales War Room", description: "Team ranks, sales, incentives, kudos, achievers, targets.", icon: <Trophy className="h-4 w-4" />,         perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/templates",      label: "Templates & Links", description: "WhatsApp templates + all page/social links, copy-ready.", icon: <MessageCircle className="h-4 w-4" />,   perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/deals",          label: "Deals",          description: "Formal deal pipeline — proposals, negotiations, closures.", icon: <Briefcase className="h-4 w-4" />,       perm: "leads.view" },
  { group: "Sales & CRM", href: "/admin/tasks",          label: "Tasks",          description: "Follow-ups, demos, payment reminders.",                   icon: <CheckSquare className="h-4 w-4" />,     perm: "tasks.view" },

  // ── Marketing ────────────────────────────────────────────────
  { group: "Marketing", href: "/admin/email",          label: "Email",          description: "Templates, automation queue, test sends.",                icon: <Mail className="h-4 w-4" />,            perm: "email.view" },
  { group: "Marketing", href: "/admin/marketing",      label: "Marketing",      description: "Meta leads, Google leads, campaign performance.",        icon: <Megaphone className="h-4 w-4" />,       perm: "marketing.view" },
  { group: "Marketing", href: "/admin/analytics",      label: "Analytics",      description: "Meta Ads, Google Analytics, Clarity — all in one.",      icon: <BarChart3 className="h-4 w-4" />,       perm: "marketing.view" },
  { group: "Marketing", href: "/admin/affiliates",     label: "Affiliates",     description: "Referral partners, commissions, payouts.",                icon: <Handshake className="h-4 w-4" />,       perm: "affiliates.view" },

  // ── Finance ──────────────────────────────────────────────────
  { group: "Finance", href: "/admin/invoices",       label: "Invoices",       description: "Every paid order, search and download bills.",           icon: <Receipt className="h-4 w-4" />,         perm: "invoices.view_all" },
  { group: "Finance", href: "/admin/subscriptions",  label: "Subscriptions",  description: "Plan validity, renewals due, expired accounts.",         icon: <CalendarClock className="h-4 w-4" />,   perm: "subscriptions.view" },
  { group: "Finance", href: "/admin/credits-center", label: "Credits",        description: "Balances, purchased, consumed, manual adjustments.",    icon: <Gem className="h-4 w-4" />,             perm: "credits.view" },
  { group: "Finance", href: "/admin/finance",        label: "Finance",        description: "Revenue, expenses, hosting, ads spend, net profit.",     icon: <Wallet className="h-4 w-4" />,          perm: "finance.view" },

  // ── AI ───────────────────────────────────────────────────────
  { group: "AI", href: "/admin/agents",         label: "Agents",         description: "Enable/disable AI agents, set credits, prompt version.", icon: <Bot className="h-4 w-4" />,             perm: "agents.view" },
  { group: "AI", href: "/admin/ai-operations",  label: "AI Operations",  description: "Generations, failures, credits consumed, performance.",  icon: <Zap className="h-4 w-4" />,             perm: "ai_ops.view" },
  { group: "AI", href: "/admin/generation-log", label: "Generation Log", description: "Every generation — agent, user, status, cost to company.", icon: <ScrollText className="h-4 w-4" />,      perm: "ai_ops.view" },
  { group: "AI", href: "/admin/ai-costs",       label: "AI Costs",       description: "API spend per agent, top consumers, margin analysis.",   icon: <Coins className="h-4 w-4" />,           perm: "ai_costs.view" },
  { group: "AI", href: "/admin/ai-assistant",   label: "AI Assistant",   description: "Meeting summaries, sales coaching, WhatsApp reply drafts.", icon: <Sparkles className="h-4 w-4" />,        perm: "dashboard.view" },

  // ── Support ──────────────────────────────────────────────────
  { group: "Support", href: "/admin/support-center", label: "Support",        description: "Customer tickets — billing, generation, refunds.",       icon: <Ticket className="h-4 w-4" />,          perm: "support.view" },
  { group: "Support", href: "/admin/whatsapp",       label: "WhatsApp Inbox", description: "Live customer chats, AI-drafted replies, send.",         icon: <MessageCircle className="h-4 w-4" />,   perm: "support.view" },
  { group: "Support", href: "/admin/refunds-center", label: "Refunds & Disputes", description: "Refund requests, disputes, chargebacks tracking.",  icon: <Undo2 className="h-4 w-4" />,           perm: "support.view" },
  { group: "Support", href: "/admin/approvals",      label: "Approvals",      description: "Discount, refund, expense requests — approve/reject.",   icon: <BadgeCheck className="h-4 w-4" />,      perm: "approvals.view" },

  // ── People & Hiring ──────────────────────────────────────────
  { group: "People & Hiring", href: "/admin/team",            label: "Team",           description: "Manage admins and roles.",                               icon: <ShieldQuestion className="h-4 w-4" />,  perm: "team.view" },
  { group: "People & Hiring", href: "/admin/team/attendance", label: "Attendance",     description: "Check-ins, session time, work logs, monthly summary.",   icon: <Clock className="h-4 w-4" />,           perm: "team.view" },
  { group: "People & Hiring", href: "/admin/incentives",      label: "Incentives",     description: "Commission rules, monthly targets, achievement tracking.", icon: <Target className="h-4 w-4" />,        perm: "incentives.view" },
  { group: "People & Hiring", href: "/admin/leaderboard",     label: "Leaderboard",    description: "Sales rankings, attendance, tasks — badges & medals.",  icon: <Trophy className="h-4 w-4" />,          perm: "team.view" },
  { group: "People & Hiring", href: "/admin/hr",              label: "HR",             description: "Employees, salary records, leave management.",            icon: <UserCog className="h-4 w-4" />,         perm: "hr.view" },
  { group: "People & Hiring", href: "/admin/recruitment",     label: "Hiring OS",      description: "No-resume hiring — candidates, assessments, pipeline.",   icon: <GraduationCap className="h-4 w-4" />,   perm: "hr.view" },
  { group: "People & Hiring", href: "/admin/academy",         label: "Learn & Earn Academy", description: "WFH candidates — registration, training, assessment, payroll.", icon: <BookOpen className="h-4 w-4" />, perm: "hr.view" },
  { group: "People & Hiring", href: "/admin/knowledge-base",  label: "Knowledge Base", description: "SOPs, sales scripts, support docs, training material.", icon: <BookOpen className="h-4 w-4" />,        perm: "kb.view" },

  // ── Influencers ──────────────────────────────────────────────
  { group: "Influencers", href: "/admin/influencers", label: "Influencer Hub", description: "Creator profiles, video approvals, pin/delete, scripts, likes, comments, revenue.", icon: <Star className="h-4 w-4" />, perm: "marketing.view" },

  // ── Content ──────────────────────────────────────────────────
  { group: "Content", href: "/admin/posts",          label: "Content",        description: "Blog, news and product updates.",                        icon: <FileText className="h-4 w-4" />,        perm: "content.view" },
  { group: "Content", href: "/admin/testimonials",   label: "Testimonials",   description: "Customer reviews on the homepage.",                     icon: <MessageSquare className="h-4 w-4" />,   perm: "testimonials.manage" },

  // ── System ───────────────────────────────────────────────────
  { group: "System", href: "/admin/automation",      label: "Automation",     description: "If-then rules — auto-assign, email, notify on events.",  icon: <GitPullRequest className="h-4 w-4" />,  perm: "settings.view" },
  { group: "System", href: "/admin/integrations",   label: "Integrations",   description: "Connection status — Meta, Google, Razorpay, FAL, n8n.", icon: <Link2 className="h-4 w-4" />,           perm: "settings.view" },
  { group: "System", href: "/admin/settings",       label: "Settings",       description: "Company info, plans, credits, notification config.",    icon: <Settings className="h-4 w-4" />,        perm: "settings.view" },
  { group: "System", href: "/admin/error-logs",      label: "Error Logs",     description: "System failures — generation, API, webhook, payment.",   icon: <AlertTriangle className="h-4 w-4" />,   perm: "audit.view" },
  { group: "System", href: "/admin/audit",          label: "Audit Log",      description: "Every sensitive action — refunds, role changes, edits.",icon: <ClipboardList className="h-4 w-4" />,  perm: "audit.view" },
  { group: "System", href: "/admin/help",            label: "Help & Rules",   description: "Your role's rules, backend tips + AI help assistant.",   icon: <HelpCircle className="h-4 w-4" />,      perm: "leads.view" },
];

export default function AdminHomePage() {
  const { loading, isAdmin, has, role, email } = useAdminPermissions();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }
  if (!email) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-500" />
          <h1 className="mt-3 text-base font-bold">Admin sign-in required</h1>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-indigo-600"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            {email} is not on the admin allowlist or has been deactivated.
          </p>
        </div>
      </main>
    );
  }

  const visibleTiles = TILES.filter((t) => has(t.perm));

  // Group tiles by category, preserving GROUP_ORDER.
  const grouped = GROUP_ORDER
    .map((g) => ({ group: g, tiles: visibleTiles.filter((t) => t.group === g) }))
    .filter((s) => s.tiles.length > 0);

  return (
    <AdminShell
      breadcrumbs={[{ label: "Dashboard" }]}
      title="Console"
      subtitle={`Signed in as ${role ?? "—"} · ${visibleTiles.length} modules`}
      email={email}
    >
      {visibleTiles.length === 0 ? (
        <p className={`mt-6 text-center text-sm ${adminMutedCls}`}>
          Your role does not grant access to any module yet. Contact the founder.
        </p>
      ) : (
        <div className="space-y-7">
          {/* Sticky section nav — click to jump */}
          <nav className="sticky top-14 z-20 -mx-4 mb-1 flex flex-wrap gap-1.5 border-b border-slate-200 bg-[#f7f8fb]/90 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-[#0b0d12]/90 sm:-mx-6 sm:px-6">
            {grouped.map((section) => (
              <a key={section.group} href={`#sec-${section.group.replace(/\s+/g, "-")}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500">
                {section.group}
              </a>
            ))}
          </nav>

          {grouped.map((section) => (
            <section key={section.group} id={`sec-${section.group.replace(/\s+/g, "-")}`} className="scroll-mt-28">
              <div className="mb-2.5 flex items-center gap-3">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  {section.group}
                </h2>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-slate-800">
                  {section.tiles.length}
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.tiles.map((t) => (
                  <Link key={t.href} href={t.href}>
                    <div className={`${adminCardCls} group flex items-start justify-between gap-3 p-4 transition hover:border-slate-300 dark:hover:border-slate-700`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {t.icon}
                          </span>
                          <h3 className="text-sm font-bold">{t.label}</h3>
                        </div>
                        <p className={`mt-1.5 text-xs leading-5 ${adminMutedCls}`}>
                          {t.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
