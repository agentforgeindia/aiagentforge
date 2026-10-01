"use client";

// ============================================================
// /admin — admin home. Find any module fast:
//   search → pinned → recently opened → all hubs by section.
// Founder also sees the archived (hidden) modules at the bottom.
// ============================================================

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowRight, Clock, Search, ShieldCheck, Star, X } from "lucide-react";
import { ARCHIVED, HUB_GROUPS, tabLabel } from "./adminHubs";
import AdminShell from "./AdminShell";
import { useAdminPermissions } from "./AdminPermissions";
import { usePinned, useRecent } from "./navPrefs";
import { hubTint, resolvePin, useVisibleHubs } from "./Sidebar";
import { useAdminLang } from "./i18n";
import TrainingNudge from "./training/TrainingNudge";

function GateCard({ tone, title, text, cta }: { tone: "neutral" | "danger"; title: string; text?: string; cta?: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${tone === "danger" ? "bg-rose-50 text-rose-600" : "bg-violet-50 text-violet-600"}`}>
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-[#020D23]">{title}</h1>
        {text && <p className="mt-1.5 text-sm text-slate-500">{text}</p>}
        {cta && (
          <Link href="/login" className="mt-5 inline-flex rounded-xl bg-[#6D3FE8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5B2FD6]">
            Sign in
          </Link>
        )}
      </div>
    </main>
  );
}

export default function AdminHomePage() {
  const { loading, isAdmin, role, email, isFounder } = useAdminPermissions();
  const { pinned, setPinned } = usePinned();
  const recent = useRecent();
  const router = useRouter();
  const { t, tl, lang } = useAdminLang();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("all");
  const hubs = useVisibleHubs();

  const pinnedKeys = useMemo(
    () => Array.from(new Set(pinned.map((p) => resolvePin(p)?.key).filter(Boolean))) as string[],
    [pinned],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] text-sm text-slate-500">
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        Checking access…
      </main>
    );
  }
  if (!email) return <GateCard tone="neutral" title="Admin sign-in required" text="Please sign in with your admin account." cta />;
  if (!isAdmin) return <GateCard tone="danger" title="Access denied" text={`${email} is not on the admin allowlist or has been deactivated.`} />;

  const togglePin = (k: string) => {
    const rest = pinned.filter((p) => resolvePin(p)?.key !== k);
    setPinned(pinnedKeys.includes(k) ? rest : [...rest, k]);
  };

  const groups = HUB_GROUPS.filter((g) => hubs.some((x) => x.hub.group === g.key));
  const q = query.trim().toLowerCase();
  const matches = hubs.filter(
    ({ hub, tabs }) =>
      (group === "all" || hub.group === group) &&
      (!q ||
        [hub.label.en, hub.label.hi, hub.description.en, hub.description.hi, ...tabs.map((h) => tabLabel(h, "en")), ...tabs]
          .join(" ")
          .toLowerCase()
          .includes(q)),
  );
  const grouped = groups
    .map((g) => ({ group: g, items: matches.filter((x) => x.hub.group === g.key) }))
    .filter((s) => s.items.length > 0);

  const byKey = (k: string) => hubs.find((x) => x.hub.key === k);
  const pinnedItems = pinnedKeys.map(byKey).filter(Boolean) as typeof hubs;
  const recentItems = Array.from(new Set(recent.map((r) => resolvePin(r)?.key).filter(Boolean)))
    .map((k) => byKey(k as string))
    .filter(Boolean) as typeof hubs;

  const h = new Date().getHours();
  const hello = h < 12 ? t("morning") : h < 17 ? t("afternoon") : t("evening");
  const name = email.split("@")[0].replace(/[._-]+/g, " ");

  return (
    <AdminShell
      breadcrumbs={[{ label: "Home" }]}
      title={`${hello}, ${name}`}
      subtitle={`${new Date().toLocaleDateString(lang === "hi" ? "en-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" })} · ${hubs.length} ${t("modulesFor")} (${role ?? "—"})`}
      email={email}
    >
      {hubs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{t("noAccess")}</div>
      ) : (
        <div className="space-y-8">
          <TrainingNudge />

          {/* Search + section tabs */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_1px_2px_rgba(2,13,35,0.04),0_12px_32px_-24px_rgba(2,13,35,0.25)]">
            <label className="flex items-center gap-3 px-3">
              <Search className="h-5 w-5 shrink-0 text-violet-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                  if (e.key === "Enter" && matches[0]) router.push(matches[0].href);
                }}
                placeholder={t("homeSearch")}
                className="h-12 w-full bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Clear">
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-1.5 pb-0.5 pt-2.5 scrollbar-hide">
              {[{ key: "all", label: { en: t("all"), hi: t("all") } }, ...groups].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGroup(g.key)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition ${
                    group === g.key ? "bg-[#020D23] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tl(g.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Pinned + recent */}
          {!q && group === "all" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-[#020D23]">
                  <Star className="h-4 w-4 text-amber-500" /> {t("pinned")}
                </h2>
                {pinnedItems.length === 0 ? (
                  <p className="mt-3 text-[13px] text-slate-500">{t("pinTip")}</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pinnedItems.map(({ hub, href }) => (
                      <Link key={hub.key} href={href} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800">
                        <span className={hubTint(hub.group).fg}>{hub.icon}</span>
                        {tl(hub.label)}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-[#020D23]">
                  <Clock className="h-4 w-4 text-[#3C68FA]" /> {t("recent")}
                </h2>
                {recentItems.length === 0 ? (
                  <p className="mt-3 text-[13px] text-slate-500">{t("recentEmpty")}</p>
                ) : (
                  <ul className="mt-2 divide-y divide-slate-100">
                    {recentItems.slice(0, 4).map(({ hub, href }) => (
                      <li key={hub.key}>
                        <Link href={href} className="group flex items-center gap-3 py-2 text-[13px] text-slate-700 hover:text-violet-700">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${hubTint(hub.group).bg} ${hubTint(hub.group).fg}`}>{hub.icon}</span>
                          <span className="flex-1 font-medium">{tl(hub.label)}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {/* All hubs */}
          {grouped.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              {t("noMatch")} “{query}”.
            </div>
          ) : (
            grouped.map((section) => (
              <section key={section.group.key}>
                <h2 className="mb-3 text-[15px] font-semibold text-[#020D23]">
                  {tl(section.group.label)} <span className="ml-1 text-xs font-normal text-slate-400">{section.items.length}</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {section.items.map(({ hub, href, tabs }) => {
                    const tint = hubTint(hub.group);
                    const isPinned = pinnedKeys.includes(hub.key);
                    return (
                      <div key={hub.key} className="group relative">
                        <Link
                          href={href}
                          className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-4 pr-10 shadow-[0_1px_2px_rgba(2,13,35,0.04)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_28px_-16px_rgba(109,63,232,0.35)]"
                        >
                          <span className="flex items-start gap-3.5">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint.bg} ${tint.fg} [&_svg]:h-5 [&_svg]:w-5`}>{hub.icon}</span>
                            <span className="min-w-0">
                              <span className="block text-[14px] font-semibold text-[#020D23] group-hover:text-violet-700">{tl(hub.label)}</span>
                              <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-5 text-slate-500">{tl(hub.description)}</span>
                            </span>
                          </span>
                          {tabs.length > 1 && (
                            <span className="mt-3 flex flex-wrap gap-1 pl-[54px]">
                              {tabs.map((tb) => (
                                <span key={tb} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                                  {tabLabel(tb, lang)}
                                </span>
                              ))}
                            </span>
                          )}
                        </Link>
                        <button
                          type="button"
                          onClick={() => togglePin(hub.key)}
                          aria-label={`${isPinned ? "Unpin" : "Pin"} ${tl(hub.label)}`}
                          className={`absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-slate-100 ${
                            isPinned ? "text-amber-500" : "text-slate-300 opacity-0 hover:text-amber-500 group-hover:opacity-100 focus:opacity-100"
                          }`}
                        >
                          <Star className="h-4 w-4" fill={isPinned ? "currentColor" : "none"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          {/* Archived — founder only */}
          {isFounder && !q && group === "all" && (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Archive className="h-4 w-4" /> {t("archived")}
                <span className="font-normal text-slate-400">· {t("archivedNote")}</span>
              </h2>
              <ul className="mt-3 space-y-1.5">
                {ARCHIVED.map((a) => (
                  <li key={a.href} className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                    <Link href={a.href} className="font-medium text-slate-700 underline-offset-2 hover:text-violet-700 hover:underline">
                      {tl(a.label)}
                    </Link>
                    <span className="text-slate-400">— {tl(a.reason)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </AdminShell>
  );
}
