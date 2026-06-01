"use client";

// ============================================================
// /admin — admin home / hub. Corporate, minimal, no gradients.
// ============================================================

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  MessageSquare,
  Receipt,
  ShieldCheck,
  Users,
  UserPlus,
} from "lucide-react";
import AdminShell, { adminCardCls, adminMutedCls } from "./AdminShell";

const ADMIN_EMAILS: string[] = [
  "info@aiagentforge.in",
  "info.agentforge@gmail.com",
];

type Tile = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
};

const TILES: Tile[] = [
  {
    href: "/admin/customers",
    label: "Customers",
    description: "Signed-up users, plans, balances, notes.",
    icon: <Users className="h-4 w-4" />,
  },
  {
    href: "/admin/leads",
    label: "Leads",
    description: "Inbound prospects from ads and outreach.",
    icon: <UserPlus className="h-4 w-4" />,
  },
  {
    href: "/admin/posts",
    label: "Content",
    description: "Blog, news and product updates.",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    description: "Customer reviews on the homepage.",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    href: "/admin/invoices",
    label: "Invoices",
    description: "Auto-generated receipts and tax invoices.",
    icon: <Receipt className="h-4 w-4" />,
    badge: "Soon",
  },
];

export default function AdminHomePage() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const isAdmin = authEmail
    ? ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(authEmail.toLowerCase())
    : false;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setAuthEmail(data.session?.user?.email ?? null);
      setLoadingAuth(false);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, s) => setAuthEmail(s?.user?.email ?? null),
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }
  if (!authEmail) {
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
            {authEmail} is not on the admin allowlist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      breadcrumbs={[{ label: "Dashboard" }]}
      title="Console"
      subtitle="Customers, leads and content — one place."
      email={authEmail}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => {
          const disabled = Boolean(t.badge === "Soon");
          const inner = (
            <div
              className={`${adminCardCls} group flex items-start justify-between gap-3 p-4 transition ${
                disabled ? "opacity-60" : "hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {t.icon}
                  </span>
                  <h2 className="text-sm font-bold">{t.label}</h2>
                  {t.badge && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      {t.badge}
                    </span>
                  )}
                </div>
                <p className={`mt-1.5 text-xs leading-5 ${adminMutedCls}`}>
                  {t.description}
                </p>
              </div>
            </div>
          );
          return disabled ? (
            <div key={t.href}>{inner}</div>
          ) : (
            <Link key={t.href} href={t.href}>
              {inner}
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}
