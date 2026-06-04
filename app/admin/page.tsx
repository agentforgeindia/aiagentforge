"use client";

// ============================================================
// /admin — admin home / hub. Corporate, minimal, no gradients.
// ============================================================

import Link from "next/link";
import {
  CalendarClock,
  CheckSquare,
  ClipboardList,
  Coins,
  FileText,
  Gem,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Receipt,
  ShieldCheck,
  ShieldQuestion,
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
  /** Permission required to see this tile. */
  perm: string;
};

const TILES: Tile[] = [
  {
    href: "/admin/dashboard",
    label: "War Room",
    description: "Today's revenue, signups, pipeline, alerts.",
    icon: <LayoutDashboard className="h-4 w-4" />,
    perm: "dashboard.view",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    description: "Signed-up users, plans, balances, notes.",
    icon: <Users className="h-4 w-4" />,
    perm: "customers.view",
  },
  {
    href: "/admin/leads",
    label: "Leads",
    description: "Inbound prospects from ads and outreach.",
    icon: <UserPlus className="h-4 w-4" />,
    perm: "leads.view",
  },
  {
    href: "/admin/tasks",
    label: "Tasks",
    description: "Follow-ups, demos, payment reminders.",
    icon: <CheckSquare className="h-4 w-4" />,
    perm: "tasks.view",
  },
  {
    href: "/admin/email",
    label: "Email",
    description: "Templates, automation queue, test sends.",
    icon: <Mail className="h-4 w-4" />,
    perm: "email.view",
  },
  {
    href: "/admin/invoices",
    label: "Invoices",
    description: "Every paid order, search and download bills.",
    icon: <Receipt className="h-4 w-4" />,
    perm: "invoices.view_all",
  },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    description: "Plan validity, renewals due, expired accounts.",
    icon: <CalendarClock className="h-4 w-4" />,
    perm: "subscriptions.view",
  },
  {
    href: "/admin/ai-costs",
    label: "AI Costs",
    description: "API spend per agent, top consumers, margin analysis.",
    icon: <Coins className="h-4 w-4" />,
    perm: "ai_costs.view",
  },
  {
    href: "/admin/team",
    label: "Team",
    description: "Manage admins and roles.",
    icon: <ShieldQuestion className="h-4 w-4" />,
    perm: "team.view",
  },
  {
    href: "/admin/posts",
    label: "Content",
    description: "Blog, news and product updates.",
    icon: <FileText className="h-4 w-4" />,
    perm: "content.view",
  },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    description: "Customer reviews on the homepage.",
    icon: <MessageSquare className="h-4 w-4" />,
    perm: "testimonials.manage",
  },
  {
    href: "/admin/ai-operations",
    label: "AI Operations",
    description: "Generations, failures, credits consumed, agent performance.",
    icon: <Zap className="h-4 w-4" />,
    perm: "ai_ops.view",
  },
  {
    href: "/admin/credits-center",
    label: "Credits",
    description: "Balances, purchased, consumed, refunds, manual adjustments.",
    icon: <Gem className="h-4 w-4" />,
    perm: "credits.view",
  },
  {
    href: "/admin/finance",
    label: "Finance",
    description: "Revenue, expenses, hosting, ads spend, net profit.",
    icon: <Wallet className="h-4 w-4" />,
    perm: "finance.view",
  },
  {
    href: "/admin/audit",
    label: "Audit log",
    description: "Every sensitive action — refunds, role changes, manual edits.",
    icon: <ClipboardList className="h-4 w-4" />,
    perm: "audit.view",
  },
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

  return (
    <AdminShell
      breadcrumbs={[{ label: "Dashboard" }]}
      title="Console"
      subtitle={`Signed in as ${role ?? "—"}`}
      email={email}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTiles.map((t) => (
          <Link key={t.href} href={t.href}>
            <div className={`${adminCardCls} group flex items-start justify-between gap-3 p-4 transition hover:border-slate-300 dark:hover:border-slate-700`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {t.icon}
                  </span>
                  <h2 className="text-sm font-bold">{t.label}</h2>
                </div>
                <p className={`mt-1.5 text-xs leading-5 ${adminMutedCls}`}>
                  {t.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {visibleTiles.length === 0 && (
        <p className={`mt-6 text-center text-sm ${adminMutedCls}`}>
          Your role does not grant access to any module yet. Contact the founder.
        </p>
      )}
    </AdminShell>
  );
}
