"use client";

// ============================================================
// Generation source — where a user makes generations from
// ============================================================
// Every generations row carries `client_source` (set by the server,
// see lib/clientSource.ts):
//   app        — the AgentForge mobile app
//   mobile_web — a phone / tablet browser on aiagentforge.in
//   web        — a desktop / laptop browser
//   null       — made before tracking started (shown as "Not recorded")
//
// Shared by the Generation Log (all users) and the Customer page
// (one user): <SourceBadge> for a table cell, <SourceSplit> for the
// counts card.
// ============================================================

import { useEffect, useState } from "react";
import { Globe, Monitor, Smartphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { L } from "./adminHubs";
import { useAdminLang } from "./i18n";

export type GenSource = "app" | "mobile_web" | "web";

export const SOURCE_ORDER: GenSource[] = ["app", "mobile_web", "web"];

// Colours checked with the dataviz palette validator (all pairs, light
// surface). Text never wears these — they only colour the dot / bar.
export const SOURCE_META: Record<GenSource, { label: L; hint: L; color: string; Icon: typeof Globe }> = {
  app: {
    label: { en: "Mobile app", hi: "Mobile app" },
    hint: { en: "AgentForge app on the phone", hi: "Phone par AgentForge app" },
    color: "#4a3aa7",
    Icon: Smartphone,
  },
  mobile_web: {
    label: { en: "Mobile browser", hi: "Mobile browser" },
    hint: { en: "Website opened on a phone / tablet", hi: "Phone / tablet par website" },
    color: "#1baf7a",
    Icon: Globe,
  },
  web: {
    label: { en: "Desktop website", hi: "Desktop website" },
    hint: { en: "Website on a computer / laptop", hi: "Computer / laptop par website" },
    color: "#3987e5",
    Icon: Monitor,
  },
};

const T = {
  notRecorded: { en: "Not recorded", hi: "Record nahi" },
  notRecordedTip: { en: "Made before source tracking started", hi: "Tracking shuru hone se pehle bani thi" },
  empty: {
    en: "No generation has been recorded with a source yet. New generations will show up here.",
    hi: "Abhi tak source ke saath koi generation record nahi hui. Nayi generations yahan dikhengi.",
  },
  older: { en: "older generations have no source", hi: "purani generations ka source record nahi hai" },
  since: { en: "tracking started", hi: "tracking shuru hui" },
  last: { en: "last", hi: "aakhri" },
  never: { en: "never", hi: "kabhi nahi" },
  loading: { en: "Loading…", hi: "Load ho raha hai…" },
};

export function isGenSource(v: unknown): v is GenSource {
  return v === "app" || v === "mobile_web" || v === "web";
}

/** Table cell: coloured icon + label, or a muted dash for old rows. */
export function SourceBadge({ source }: { source: string | null | undefined }) {
  const { tl } = useAdminLang();
  if (!isGenSource(source)) {
    return (
      <span className="text-xs text-slate-400" title={tl(T.notRecordedTip)}>
        — <span className="sr-only">{tl(T.notRecorded)}</span>
      </span>
    );
  }
  const m = SOURCE_META[source];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700"
      title={tl(m.hint)}
    >
      <m.Icon className="h-3 w-3" style={{ color: m.color }} aria-hidden />
      {tl(m.label)}
    </span>
  );
}

export type SourceStats = {
  app: number;
  mobile_web: number;
  web: number;
  unknown: number;
  total: number;
  last_app: string | null;
  last_mobile_web: string | null;
  last_web: string | null;
  tracked_since: string | null;
};

/** Counts per source — all users (userId omitted) or one user. `days` null = all time. */
export function useSourceStats(userId?: string | null, days?: number | null, refreshKey = 0) {
  const [stats, setStats] = useState<SourceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.rpc("generation_source_stats", {
        p_user_id: userId ?? null,
        p_days: days ?? null,
      });
      if (!alive) return;
      setStats(error ? null : ((data as SourceStats | null) ?? null));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [userId, days, refreshKey]);

  return { stats, loading };
}

function shortDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Card body: one thin split bar + a tile per source (label, count, share, last used). */
export function SourceSplit({ stats, loading }: { stats: SourceStats | null; loading?: boolean }) {
  const { tl } = useAdminLang();

  if (loading) return <p className="mt-3 text-xs text-slate-400">{tl(T.loading)}</p>;
  if (!stats) return null;

  const tracked = stats.app + stats.mobile_web + stats.web;
  const lastOf: Record<GenSource, string | null> = {
    app: stats.last_app,
    mobile_web: stats.last_mobile_web,
    web: stats.last_web,
  };

  return (
    <div className="mt-3">
      {tracked === 0 ? (
        <p className="text-xs text-slate-500">{tl(T.empty)}</p>
      ) : (
        <>
          {/* Split bar — 2px gaps between segments, colour = source */}
          <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Generations by source">
            {SOURCE_ORDER.filter((s) => stats[s] > 0).map((s) => (
              <span
                key={s}
                className="h-full rounded-full"
                style={{ width: `${(stats[s] / tracked) * 100}%`, minWidth: 6, backgroundColor: SOURCE_META[s].color }}
                title={`${tl(SOURCE_META[s].label)}: ${stats[s]} (${Math.round((stats[s] / tracked) * 100)}%)`}
              />
            ))}
          </div>

          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SOURCE_ORDER.map((s) => {
              const m = SOURCE_META[s];
              const n = stats[s];
              const pct = Math.round((n / tracked) * 100);
              const pctText = n > 0 && pct === 0 ? "<1%" : `${pct}%`;
              return (
                <div key={s} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5" title={tl(m.hint)}>
                  <dt className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: m.color }} aria-hidden />
                    <m.Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    {tl(m.label)}
                  </dt>
                  <dd className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-semibold tabular-nums text-[#020D23]">{n.toLocaleString("en-IN")}</span>
                    <span className="text-xs tabular-nums text-slate-500">{pctText}</span>
                    <span className="ml-auto text-[11px] text-slate-400">
                      {tl(T.last)}: {shortDate(lastOf[s]) ?? tl(T.never)}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </>
      )}

      {stats.unknown > 0 && (
        <p className="mt-2 text-[11px] text-slate-400">
          {stats.unknown.toLocaleString("en-IN")} {tl(T.older)}
          {stats.tracked_since ? ` (${tl(T.since)} ${shortDate(stats.tracked_since)})` : ""}.
        </p>
      )}
    </div>
  );
}
