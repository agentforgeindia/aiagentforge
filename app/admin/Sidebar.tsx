"use client";

// ============================================================
// Sidebar — light, grouped navigation built from HUBS.
//   • Quick filter box
//   • Pinned hubs on top (☆)
//   • Collapsible groups — the current page's group opens itself
//   • Icon-rail mode on desktop (collapsed prop)
// Only hubs with at least one page the admin may open are shown.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Search, Star, X } from "lucide-react";
import { HUBS, HUB_GROUPS, hubByKey, locate, visibleTabs, type Hub } from "./adminHubs";
import { useAdminPermissions } from "./AdminPermissions";
import { useOpenGroups, usePinned } from "./navPrefs";
import { useAdminLang } from "./i18n";

const TINT: Record<string, { bg: string; fg: string }> = {
  overview:  { bg: "bg-violet-50",  fg: "text-violet-600" },
  sales:     { bg: "bg-blue-50",    fg: "text-blue-600" },
  marketing: { bg: "bg-orange-50",  fg: "text-orange-600" },
  money:     { bg: "bg-emerald-50", fg: "text-emerald-600" },
  ai:        { bg: "bg-purple-50",  fg: "text-purple-600" },
  people:    { bg: "bg-amber-50",   fg: "text-amber-600" },
  system:    { bg: "bg-slate-100",  fg: "text-slate-600" },
};
export const hubTint = (group: string) => TINT[group] ?? TINT.overview;

/** Hubs this admin can open, each with its landing href. */
export function useVisibleHubs() {
  const { has } = useAdminPermissions();
  return useMemo(
    () =>
      HUBS.map((h) => ({ hub: h, tabs: visibleTabs(h, has) }))
        .filter((x) => x.tabs.length > 0)
        .map((x) => ({ ...x, href: x.tabs[0] })),
    [has],
  );
}

/** Pins may hold hub keys or (older) page hrefs. */
export function resolvePin(p: string): Hub | undefined {
  return hubByKey(p) ?? locate(p)?.hub;
}

export default function Sidebar({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const { t, tl } = useAdminLang();
  const [query, setQuery] = useState("");
  const { pinned, setPinned } = usePinned();
  const [openGroups, setOpenGroups] = useOpenGroups();
  const hubs = useVisibleHubs();

  const activeKey = locate(pathname)?.hub.key ?? null;
  const activeGroup = HUBS.find((h) => h.key === activeKey)?.group;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? hubs.filter(({ hub }) =>
        [hub.label.en, hub.label.hi, hub.description.en, hub.description.hi, hub.key]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : hubs;

  const grouped = HUB_GROUPS.map((g) => ({
    group: g,
    items: filtered.filter((x) => x.hub.group === g.key),
  })).filter((s) => s.items.length > 0);

  const pinnedKeys = Array.from(new Set(pinned.map((p) => resolvePin(p)?.key).filter(Boolean))) as string[];
  const pinnedItems = pinnedKeys
    .map((k) => hubs.find((x) => x.hub.key === k))
    .filter(Boolean) as typeof hubs;
  const isPinnedKey = (k: string) => pinnedKeys.includes(k);
  const togglePinKey = (k: string) => {
    // drop every pin (key or legacy href) of this hub, then add back if pinning
    const rest = pinned.filter((p) => resolvePin(p)?.key !== k);
    setPinned(isPinnedKey(k) ? rest : [...rest, k]);
  };

  const isOpen = (g: string) =>
    q.length > 0 || g === activeGroup || (openGroups === null ? true : openGroups.includes(g));
  const toggleGroup = (g: string) => {
    const base = openGroups ?? HUB_GROUPS.map((x) => x.key);
    setOpenGroups(base.includes(g) ? base.filter((x) => x !== g) : [...base, g]);
  };

  // ── Icon rail ──
  if (collapsed) {
    return (
      <nav className="flex h-full flex-col items-center gap-1 overflow-y-auto px-2 py-3">
        {hubs.map(({ hub, href }) => {
          const active = hub.key === activeKey;
          return (
            <Link
              key={hub.key}
              href={href}
              onClick={onNavigate}
              title={tl(hub.label)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                active ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {hub.icon}
            </Link>
          );
        })}
      </nav>
    );
  }

  const renderItem = ({ hub, href, tabs }: (typeof hubs)[number], keyPrefix = "") => {
    const active = hub.key === activeKey;
    const tint = hubTint(hub.group);
    const pinnedNow = isPinnedKey(hub.key);
    return (
      <div key={keyPrefix + hub.key} className="group/item relative">
        <Link
          href={href}
          onClick={onNavigate}
          className={`relative flex items-center gap-2.5 rounded-lg py-1.5 pl-2 pr-8 text-[13px] transition ${
            active ? "bg-violet-50 font-semibold text-violet-800" : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {active && (
            <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#3C68FA] via-[#9B58FC] to-[#FD6D08]" />
          )}
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
              active ? `${tint.bg} ${tint.fg}` : "text-slate-400 group-hover/item:text-slate-600"
            }`}
          >
            {hub.icon}
          </span>
          <span className="truncate">{tl(hub.label)}</span>
          {tabs.length > 1 && (
            <span className="ml-auto rounded-md bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-400 group-hover/item:opacity-0">
              {tabs.length}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => togglePinKey(hub.key)}
          aria-label={`${pinnedNow ? "Unpin" : "Pin"} ${tl(hub.label)}`}
          className={`absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition hover:bg-white ${
            pinnedNow ? "text-amber-500" : "text-slate-300 opacity-0 hover:text-amber-500 group-hover/item:opacity-100 focus:opacity-100"
          }`}
        >
          <Star className="h-3.5 w-3.5" fill={pinnedNow ? "currentColor" : "none"} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pb-2 pt-3">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition focus-within:border-violet-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder={t("findModule")}
            className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {!q && pinnedItems.length > 0 && (
          <div className="mb-2 mt-1">
            <p className="flex items-center gap-1.5 px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Star className="h-3 w-3" /> {t("pinned")}
            </p>
            <div className="space-y-0.5">{pinnedItems.map((x) => renderItem(x, "pin-"))}</div>
          </div>
        )}

        {grouped.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-slate-400">
            {t("noMatch")} “{query}”.
          </p>
        )}

        {grouped.map((section) => {
          const open = isOpen(section.group.key);
          return (
            <div key={section.group.key} className="mt-1">
              <button
                type="button"
                onClick={() => toggleGroup(section.group.key)}
                disabled={q.length > 0}
                className="flex w-full items-center justify-between rounded-md px-2 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:text-slate-700"
              >
                <span>{tl(section.group.label)}</span>
                {!q && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />}
              </button>
              {open && <div className="space-y-0.5">{section.items.map((x) => renderItem(x))}</div>}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
