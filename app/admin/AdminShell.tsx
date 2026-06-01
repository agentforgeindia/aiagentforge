"use client";

// ============================================================
// AdminShell — shared chrome for every /admin page.
// ============================================================
// Provides:
//   • Top bar with logo, admin label, signed-in email
//   • Breadcrumb back navigation (Admin / Section / Page)
//   • Optional right-hand actions slot
//   • Consistent corporate styling — slate/indigo, no gradients,
//     no emoji decoration, tight spacing.
//
// Usage:
//   <AdminShell
//     breadcrumbs={[
//       { label: "Customers", href: "/admin/customers" },
//       { label: profile.full_name ?? profile.email },
//     ]}
//     title="Bhavin Joshi"
//     subtitle="Pro Creator · 12,000 credits"
//     actions={<Button>Edit</Button>}
//   >
//     ...page content...
//   </AdminShell>
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, LogOut } from "lucide-react";

export type Crumb = { label: string; href?: string };

export default function AdminShell({
  breadcrumbs,
  title,
  subtitle,
  actions,
  email,
  children,
}: {
  breadcrumbs: Crumb[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  email?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const goBack = () => {
    // If browser history has a previous admin page, use it.
    // Otherwise fall back to the parent breadcrumb or /admin.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    const parent =
      breadcrumbs.length > 1
        ? breadcrumbs[breadcrumbs.length - 2]?.href
        : "/admin";
    router.push(parent ?? "/admin");
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-900 dark:bg-[#0b0d12] dark:text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-[#0b0d12]/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
              <Image
                src="/af-logo.png"
                alt="AgentForge"
                width={28}
                height={28}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">
                AgentForge
              </p>
              <p className="-mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Admin Console
              </p>
            </div>
          </Link>

          {email && (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {email}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumb + title bar */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1117]">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <span aria-hidden="true">·</span>
            <Link
              href="/admin"
              className="hover:text-slate-900 dark:hover:text-slate-100"
            >
              Admin
            </Link>
            {breadcrumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                {c.href ? (
                  <Link
                    href={c.href}
                    className="hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 dark:text-slate-200">
                    {c.label}
                  </span>
                )}
              </span>
            ))}
          </nav>

          {/* Title + actions */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────────
// Shared primitives — drop-in styles for consistent corporate UI.
// ────────────────────────────────────────────────────────────

export const adminCardCls =
  "rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#11141a]";

export const adminMutedCls = "text-slate-500 dark:text-slate-400";

export const adminInputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export const adminPrimaryBtnCls =
  "inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500";

export const adminSecondaryBtnCls =
  "inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export const adminGhostBtnCls =
  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";
