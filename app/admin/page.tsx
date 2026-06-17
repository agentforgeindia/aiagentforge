"use client";

// ============================================================
// /admin — admin home / hub. Corporate, minimal, no gradients.
// ============================================================

import Link from "next/link";
import { useState } from "react";
import { Crosshair, ShieldCheck } from "lucide-react";
import {
  TILES,
  GROUP_ORDER,
  accentFor,
  GROUP_ICON,
} from "./adminNav";
import AdminShell, { adminMutedCls } from "./AdminShell";
import { useAdminPermissions } from "./AdminPermissions";


export default function AdminHomePage() {
  const { loading, isAdmin, has, role, email } = useAdminPermissions();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

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

  // Tab navigation — one category open at a time (defaults to the first).
  const activeGroup = openGroup ?? grouped[0]?.group ?? null;
  const activeTiles = grouped.find((s) => s.group === activeGroup)?.tiles ?? [];

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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Left sidebar — category nav (horizontal scroll on mobile) */}
          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:sticky lg:top-16 lg:mx-0 lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-0 lg:pb-0">
            {grouped.map((section) => {
              const isActive = section.group === activeGroup;
              return (
                <button
                  key={section.group}
                  type="button"
                  onClick={() => setOpenGroup(section.group)}
                  className={`inline-flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all duration-200 lg:w-full ${
                    isActive
                      ? `border-transparent bg-gradient-to-br ${accentFor(section.group)} text-white shadow-lg shadow-cyan-500/25`
                      : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-[#11141a] dark:text-slate-300 dark:hover:border-cyan-500/50"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? "bg-white/20 text-white" : `bg-gradient-to-br ${accentFor(section.group)} text-white`
                    }`}
                  >
                    {GROUP_ICON[section.group] ?? <Crosshair className="h-4 w-4" />}
                  </span>
                  <span className="flex-1 whitespace-nowrap text-left lg:whitespace-normal">{section.group}</span>
                  <span className={`rounded-full px-1.5 text-[10px] ${isActive ? "bg-white/25" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                    {section.tiles.length}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right content — selected category's modules */}
          {activeGroup && (
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2.5">
                <span className={`h-5 w-1.5 rounded-full bg-gradient-to-b ${accentFor(activeGroup)}`} />
                <h2 className="text-sm font-black tracking-tight">{activeGroup}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-slate-800">
                  {activeTiles.length} modules
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {activeTiles.map((t) => (
                  <Link key={t.href} href={t.href} className="group block">
                    <div className="relative flex h-full items-start gap-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-16px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_10px_30px_-10px_rgba(34,211,238,0.38)] dark:border-slate-800 dark:bg-[#0e1117] dark:hover:border-cyan-500/40">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400/[0.07] via-blue-500/[0.05] to-purple-500/[0.07] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10" />
                      <span className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accentFor(activeGroup)} text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                        {t.icon}
                      </span>
                      <div className="relative min-w-0">
                        <h3 className="text-sm font-black tracking-tight transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                          {t.label}
                        </h3>
                        <p className={`mt-1 text-xs leading-5 ${adminMutedCls}`}>
                          {t.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
