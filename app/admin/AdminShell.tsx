"use client";

// ============================================================
// AdminShell — shared chrome for every /admin page.
// ============================================================
// Provides:
//   • Top bar with logo, admin label, email user-menu with Sign out,
//     and a permission-gated "+ New Lead" quick button.
//   • Breadcrumb back navigation (Admin / Section / Page)
//   • Optional right-hand actions slot per page
//   • Consistent corporate styling — slate/indigo, no gradients,
//     no emoji decoration, tight spacing.
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, Clock, LogOut, Plus, Search, Sun, Moon, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdminPermissions } from "./AdminPermissions";
import { useTheme } from "@/app/components/ThemeProvider";
import NotificationsBell from "./NotificationsBell";
import CommandPalette from "./CommandPalette";
import AttendanceTimer from "./AttendanceTimer";
import ModuleTip from "./ModuleTip";

export type Crumb = { label: string; href?: string };

type DoodleType = "dashboard" | "leads" | "finance" | "team" | "analytics" | "tasks" | "customers" | "settings" | "general";

function AdminDoodles({ type = "general" }: { type?: DoodleType }) {
  const base = "pointer-events-none absolute inset-0 overflow-hidden";
  return (
    <div className={base} aria-hidden>
      {/* Universal: dot grid top-right, subtle */}
      <svg className="absolute right-4 top-4 h-24 w-24 text-slate-300/40 dark:text-slate-700/30" viewBox="0 0 60 60" fill="currentColor">
        {[8,20,32,44,56].map(y => [8,20,32,44,56].map(x => <circle key={`${x}${y}`} cx={x} cy={y} r="1.5" />))}
      </svg>

      {/* Dashboard: bar chart bottom-left */}
      {type === "dashboard" && <>
        <svg className="absolute bottom-8 left-4 h-16 w-20 text-indigo-400/15 dark:text-indigo-400/10" viewBox="0 0 80 60" fill="none">
          <rect x="4" y="30" width="12" height="26" rx="3" fill="currentColor" />
          <rect x="22" y="18" width="12" height="38" rx="3" fill="currentColor" />
          <rect x="40" y="8" width="12" height="48" rx="3" fill="currentColor" />
          <rect x="58" y="22" width="12" height="34" rx="3" fill="currentColor" />
        </svg>
        <svg className="absolute right-8 bottom-16 h-10 w-10 text-amber-400/20 dark:text-amber-400/15 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
        </svg>
      </>}

      {/* Leads: funnel + arrow */}
      {type === "leads" && <>
        <svg className="absolute bottom-10 left-4 h-16 w-12 text-cyan-400/15 dark:text-cyan-400/10" viewBox="0 0 48 60" fill="none">
          <path d="M4 4 L44 4 L30 24 L30 52 L18 52 L18 24 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" opacity="0.3" />
        </svg>
        <svg className="absolute right-6 bottom-20 h-10 w-24 text-indigo-400/15 dark:text-indigo-400/10" viewBox="0 0 96 40" fill="none">
          <path d="M4 20 L80 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M68 8 L84 20 L68 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </>}

      {/* Finance: coin + trending */}
      {type === "finance" && <>
        <svg className="absolute bottom-8 left-4 h-16 w-16 text-amber-400/15 dark:text-amber-400/10" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="24" stroke="currentColor" strokeWidth="2.5" />
          <text x="19" y="38" fontSize="22" fontWeight="900" fill="currentColor" fontFamily="serif">₹</text>
        </svg>
        <svg className="absolute right-6 bottom-14 h-12 w-24 text-emerald-400/15 dark:text-emerald-400/10" viewBox="0 0 96 48" fill="none">
          <path d="M4 40 L24 28 L44 32 L64 16 L84 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M76 4 L88 8 L84 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </>}

      {/* Team: people */}
      {type === "team" && <>
        <svg className="absolute bottom-8 left-4 h-16 w-20 text-blue-400/15 dark:text-blue-400/10" viewBox="0 0 80 60" fill="none">
          <circle cx="20" cy="16" r="10" stroke="currentColor" strokeWidth="2.5" />
          <path d="M2 54 C2 40 38 40 38 54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="52" cy="16" r="10" stroke="currentColor" strokeWidth="2.5" />
          <path d="M34 54 C34 40 70 40 70 54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </>}

      {/* Analytics: pie + bars */}
      {type === "analytics" && <>
        <svg className="absolute bottom-8 left-4 h-16 w-16 text-purple-400/15 dark:text-purple-400/10" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="2.5" strokeDasharray="50 100" />
          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="2.5" strokeDasharray="30 100" strokeDashoffset="-50" opacity="0.5" />
        </svg>
      </>}

      {/* Tasks: checklist */}
      {type === "tasks" && <>
        <svg className="absolute bottom-8 left-4 h-20 w-14 text-indigo-400/15 dark:text-indigo-400/10" viewBox="0 0 56 80" fill="none">
          <rect x="4" y="4" width="48" height="72" rx="6" stroke="currentColor" strokeWidth="2.5" />
          {[18,34,50].map((y, i) => <>
            <circle key={`c${y}`} cx="16" cy={y} r="4" stroke="currentColor" strokeWidth="2" fill={i === 0 ? "currentColor" : "none"} opacity="0.6" />
            <line key={`l${y}`} x1="26" y1={y} x2="46" y2={y} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>)}
        </svg>
      </>}

      {/* Customers: person */}
      {type === "customers" && <>
        <svg className="absolute bottom-8 left-4 h-16 w-12 text-cyan-400/15 dark:text-cyan-400/10" viewBox="0 0 48 64" fill="none">
          <circle cx="24" cy="14" r="10" stroke="currentColor" strokeWidth="2.5" />
          <path d="M4 58 C4 44 44 44 44 58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </>}

      {/* Settings: gear */}
      {type === "settings" && <>
        <svg className="absolute bottom-8 left-4 h-16 w-16 text-slate-400/15 dark:text-slate-400/10" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="10" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 8" />
        </svg>
      </>}

      {/* General: wavy line */}
      {type === "general" && <>
        <svg className="absolute bottom-12 left-4 h-10 w-28 text-slate-300/30 dark:text-slate-700/20" viewBox="0 0 120 40" fill="none">
          <path d="M2 20 Q 18 4, 34 20 T 66 20 T 98 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </>}
    </div>
  );
}

export default function AdminShell({
  breadcrumbs,
  title,
  subtitle,
  actions,
  email,
  doodleType,
  children,
}: {
  breadcrumbs: Crumb[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  email?: string | null;
  doodleType?: DoodleType;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { role, has, email: ctxEmail } = useAdminPermissions();
  const { darkMode, toggleTheme } = useTheme();
  const effectiveEmail = email ?? ctxEmail ?? null;

  const goBack = () => {
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
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex min-w-0 items-center gap-2">
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

          <div className="flex items-center gap-2">
            {/* Attendance Timer */}
            {effectiveEmail && <AttendanceTimer email={effectiveEmail} />}
            {/* Search hint — clicking dispatches Cmd+K. */}
            <button
              type="button"
              onClick={() => {
                const ev = new KeyboardEvent("keydown", {
                  key: "k",
                  ctrlKey: !navigator.platform.toLowerCase().includes("mac"),
                  metaKey: navigator.platform.toLowerCase().includes("mac"),
                  bubbles: true,
                });
                document.dispatchEvent(ev);
              }}
              className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700 sm:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Open command palette"
            >
              <Search className="h-3.5 w-3.5" />
              Search
              <kbd className="ml-1 rounded border border-slate-300 bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                ⌘K
              </kbd>
            </button>

            {has("leads.add") && (
              <Link
                href="/admin/leads?new=1"
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New lead</span>
              </Link>
            )}
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {/* My Profile link */}
            <Link
              href="/admin/my-profile"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="My Profile"
            >
              <User className="h-4 w-4" />
            </Link>
            {effectiveEmail && <NotificationsBell />}
            {effectiveEmail && (
              <UserMenu email={effectiveEmail} role={role} />
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb + title bar */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1117]">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
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
              <span
                key={`${c.label}-${i}`}
                className="flex items-center gap-1.5"
              >
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

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <AdminDoodles type={doodleType ?? "general"} />
        <div className="relative z-10">
          <ModuleTip module={title} />
          {children}
        </div>
      </div>

      {/* Global Cmd+K palette — single instance, listens at document level. */}
      <CommandPalette />
    </main>
  );
}

// ────────────────────────────────────────────────────────────
// User menu — click email → dropdown with role + Sign out
// ────────────────────────────────────────────────────────────

function UserMenu({ email, role }: { email: string; role: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[admin] signOut failed:", e);
    } finally {
      setSigningOut(false);
      router.replace("/login");
    }
  }

  // Render first 2 letters of the email as a small avatar.
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-slate-700 to-slate-900 text-[10px] font-bold text-white dark:from-indigo-500 dark:to-indigo-700">
          {initials}
        </span>
        <span className="hidden max-w-[180px] truncate sm:inline">{email}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-[#11141a]"
        >
          <div className="border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Signed in
            </p>
            <p className="mt-0.5 truncate text-sm font-bold">{email}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Role: <span className="font-bold">{role ?? "—"}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
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
