"use client";

// ============================================================
// AdminShell — shared chrome for every /admin page.
// ============================================================
// Layout:
//   • Left: light sidebar (search, pinned, collapsible groups),
//     collapsible to an icon rail on desktop, drawer on mobile.
//   • Top bar: breadcrumbs, global search (⌘K), attendance,
//     quick "New lead", notifications, account menu.
//   • Page header: title, subtitle, page actions.
// Brand: navy text #020D23, purple #9B58FC / blue #3C68FA accents,
// gradient only on the primary CTA.
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdminPermissions } from "./AdminPermissions";
import Sidebar from "./Sidebar";
import NotificationsBell from "./NotificationsBell";
import CommandPalette from "./CommandPalette";
import AttendanceTimer from "./AttendanceTimer";
import ModuleTip from "./ModuleTip";
import { ViewAsBanner, ViewAsSwitcher } from "./ViewAsSwitcher";
import { locate, tabLabel, visibleTabs } from "./adminHubs";
import { useAdminLang, LangToggle } from "./i18n";
import CheckInGate from "./CheckInGate";
import { useAttendanceStatus } from "./AttendanceTimer";
import { pushRecent, useSidebarCollapsed } from "./navPrefs";

export type Crumb = { label: string; href?: string };

type DoodleType = "dashboard" | "leads" | "finance" | "team" | "analytics" | "tasks" | "customers" | "settings" | "general";

function openCommandPalette() {
  const mac = navigator.platform.toLowerCase().includes("mac");
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", ctrlKey: !mac, metaKey: mac, bubbles: true }),
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <Image src="/af-logo.png" alt="AgentForge" width={32} height={32} className="h-full w-full object-contain p-0.5" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold tracking-tight text-[#020D23]">AgentForge</span>
          <span className="-mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
            Admin Console
          </span>
        </span>
      )}
    </Link>
  );
}

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
  /** Kept for backwards compatibility — decorative doodles were removed. */
  doodleType?: DoodleType;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { realRole, isFounder, has, email: ctxEmail } = useAdminPermissions();
  const { t, lang } = useAdminLang();
  const attStatus = useAttendanceStatus();
  const effectiveEmail = email ?? ctxEmail ?? null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarCollapsed();

  // Admin console is always light. Force-remove any dark theme the rest of
  // the site may have set, and restore it when leaving the admin section.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  // Which hub does this page belong to (for tabs + recent list).
  const here = locate(pathname);
  const hubTabs = here ? visibleTabs(here.hub, has) : [];

  // Remember recently opened hubs (shown on the admin home).
  useEffect(() => {
    if (here) pushRecent(here.hub.key);
  }, [here?.hub.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Strict attendance: everyone except the founder must be checked in.
  const locked = !!effectiveEmail && !isFounder && attStatus !== "in";

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    const parent = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2]?.href : "/admin";
    router.push(parent ?? "/admin");
  };

  const isHome = pathname === "/admin";

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#020D23]">
      {/* ── Desktop sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200/80 bg-white transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-slate-100 ${collapsed ? "justify-center px-2" : "px-4"}`}>
          <BrandMark compact={collapsed} />
        </div>
        <Sidebar collapsed={collapsed} />
        <div className={`shrink-0 border-t border-slate-100 p-2 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && t("collapse")}
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
              <BrandMark />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
              <button
                type="button"
                onClick={() => { setSidebarOpen(false); setTimeout(openCommandPalette, 50); }}
                className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-500"
              >
                <Search className="h-4 w-4" /> {t("searchAnything")}
              </button>
              {has("leads.add") && (
                <Link
                  href="/admin/leads?new=1"
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-9 items-center gap-1 rounded-xl bg-gradient-to-r from-[#3C68FA] via-[#9B58FC] to-[#FD6D08] px-3 text-[13px] font-semibold text-white"
                >
                  <Plus className="h-4 w-4" /> {t("newLead")}
                </Link>
              )}
            </div>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main column ── */}
      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
          <ViewAsBanner />
          <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden sm:block lg:hidden">
              <BrandMark compact />
            </div>

            {/* Breadcrumbs */}
            <nav className="hidden min-w-0 items-center gap-1 text-[13px] text-slate-500 md:flex">
              {!isHome && (
                <button
                  type="button"
                  onClick={goBack}
                  className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={t("back")}
                  title={t("back")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <Link href="/admin" className="rounded-md px-1.5 py-1 transition hover:bg-slate-100 hover:text-slate-900">
                Admin
              </Link>
              {breadcrumbs.map((c, i) => (
                <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  {c.href ? (
                    <Link href={c.href} className="truncate rounded-md px-1.5 py-1 transition hover:bg-slate-100 hover:text-slate-900">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate px-1.5 py-1 font-medium text-slate-900">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>

            <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={openCommandPalette}
                className="hidden h-9 w-56 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-400 transition hover:border-slate-300 hover:bg-white xl:flex"
                title="Search everything"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">{t("searchAnything")}</span>
                <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Ctrl K</kbd>
              </button>
              <button
                type="button"
                onClick={openCommandPalette}
                className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 sm:flex xl:hidden"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              <span className="hidden sm:block"><LangToggle /></span>
              <ViewAsSwitcher />

              {effectiveEmail && <AttendanceTimer email={effectiveEmail} />}

              {has("leads.add") && (
                <Link
                  href="/admin/leads?new=1"
                  className="hidden h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r sm:inline-flex from-[#3C68FA] via-[#9B58FC] to-[#FD6D08] px-3.5 text-[13px] font-semibold text-white shadow-sm shadow-violet-500/20 transition hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("newLead")}</span>
                </Link>
              )}

              {effectiveEmail && <NotificationsBell />}
              {effectiveEmail && <UserMenu email={effectiveEmail} role={realRole} />}
            </div>
          </div>
        </header>

        {/* Page header */}
        <div className="mx-auto max-w-[1400px] px-3 pt-5 sm:px-6 sm:pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold tracking-tight text-[#020D23] sm:truncate sm:text-[28px]">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500 sm:truncate">{subtitle}</p>}
            </div>
            {actions && !locked && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {hubTabs.length > 1 && here && (
            <div className="-mb-px mt-5 flex gap-1 overflow-x-auto border-b border-slate-200 scrollbar-hide">
              {hubTabs.map((href) => {
                const active = href === here.tab;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative shrink-0 rounded-t-lg px-3.5 py-2.5 text-[13px] font-medium transition ${
                      active ? "text-violet-700" : "text-slate-500 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    {tabLabel(href, lang)}
                    {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-violet-600" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <main className="mx-auto min-w-0 max-w-[1400px] px-3 pb-12 pt-5 sm:px-6 sm:pt-6">
          {locked ? (
            <CheckInGate status={attStatus} name={(effectiveEmail ?? "").split("@")[0]} />
          ) : (
            <>
              <ModuleTip module={title} />
              {children}
            </>
          )}
        </main>
      </div>

      {/* Global Cmd+K palette — single instance, listens at document level. */}
      <CommandPalette />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// User menu — avatar → dropdown with role, profile, sign out
// ────────────────────────────────────────────────────────────

function UserMenu({ email, role }: { email: string; role: string | null }) {
  const router = useRouter();
  const { t } = useAdminLang();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white pl-1 pr-2 transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#3C68FA] to-[#9B58FC] text-[11px] font-semibold text-white">
          {initials}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div role="menu" className="fixed inset-x-3 top-full z-50 mt-2 sm:absolute sm:inset-x-auto sm:right-0 overflow-hidden rounded-2xl sm:w-64 border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3C68FA] to-[#9B58FC] text-sm font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{email}</p>
              <p className="mt-0.5 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium capitalize text-violet-700">
                {role ?? "—"}
              </p>
            </div>
          </div>
          <div className="border-b border-slate-100 px-4 py-2.5 sm:hidden">
            <LangToggle />
          </div>
          <div className="p-1.5">
            <Link
              href="/admin/my-profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <User className="h-4 w-4 text-slate-400" /> {t("myProfile")}
            </Link>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? t("signingOut") : t("signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Shared primitives — used across all admin pages.
// ────────────────────────────────────────────────────────────

export const adminCardCls =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(2,13,35,0.04),0_8px_24px_-18px_rgba(2,13,35,0.18)] dark:border-slate-800 dark:bg-[#11141a]";

export const adminMutedCls = "text-slate-500 dark:text-slate-400";

export const adminInputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-300 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export const adminPrimaryBtnCls =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#6D3FE8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/20 transition hover:bg-[#5B2FD6] focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-50";

export const adminSecondaryBtnCls =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/[0.03] transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export const adminGhostBtnCls =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";
