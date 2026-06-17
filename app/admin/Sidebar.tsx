"use client";

// Persistent left navigation rail — grouped module list, filtered by the
// signed-in admin's permissions, with the current route highlighted.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TILES, GROUP_ORDER, accentFor } from "./adminNav";
import { useAdminPermissions } from "./AdminPermissions";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { has } = useAdminPermissions();
  const pathname = usePathname();

  const visible = TILES.filter((t) => has(t.perm));
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    tiles: visible.filter((t) => t.group === g),
  })).filter((s) => s.tiles.length > 0);

  return (
    <nav className="flex h-full flex-col overflow-y-auto px-3 pb-6">
      {grouped.map((section) => (
        <div key={section.group} className="mt-3 first:mt-1">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {section.group}
          </p>
          <div className="space-y-0.5">
            {section.tiles.map((t) => {
              const active =
                pathname === t.href || pathname.startsWith(t.href + "/");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                  }`}
                >
                  {active && (
                    <span
                      className={`absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b ${accentFor(
                        t.group,
                      )}`}
                    />
                  )}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition ${
                      active
                        ? `bg-gradient-to-br ${accentFor(t.group)} text-white shadow-sm shadow-cyan-500/20`
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {t.icon}
                  </span>
                  <span className="truncate">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
