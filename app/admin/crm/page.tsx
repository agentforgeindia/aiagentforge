"use client";

// ============================================================
// /admin/crm — modern CRM / sales dashboard (gradient KPI cards,
// pipeline donut, won-trend line, team-performance heatmap table).
// Lightweight inline SVG charts — no chart library.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, ShieldCheck } from "lucide-react";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Kpis = {
  total_deals: number;
  pipeline_value: number;
  won_value: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
  win_rate: number;
  weighted_value: number;
  avg_deal_value: number;
};
type StageRow = { stage: string; count: number; value: number };
type OwnerRow = {
  owner: string;
  deals: number;
  open: number;
  won: number;
  lost: number;
  value: number;
  won_value: number;
  win_rate: number;
};
type Month = { key: string; label: string; won_value: number; won_count: number };

const STAGE_META: Record<string, { label: string; color: string }> = {
  prospecting: { label: "Prospecting", color: "#3b82f6" },
  qualification: { label: "Qualification", color: "#0ea5e9" },
  proposal: { label: "Proposal", color: "#6366f1" },
  negotiation: { label: "Negotiation", color: "#a855f7" },
  closed_won: { label: "Closed Won", color: "#10b981" },
  closed_lost: { label: "Closed Lost", color: "#f43f5e" },
};

function inr(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// ── Donut (segments → ring) ──────────────────────────────────
function Donut({
  segments,
  size = 190,
  thickness = 26,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-44 w-44 shrink-0">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-slate-100 dark:text-white/5" />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
              strokeLinecap="butt"
            />
          );
          acc += len;
          return el;
        })}
      </g>
    </svg>
  );
}

// ── Line chart (monthly won value) ───────────────────────────
function LineChart({ points }: { points: { label: string; value: number }[] }) {
  const W = 340;
  const H = 130;
  const pad = { l: 6, r: 6, t: 10, b: 18 };
  const max = Math.max(...points.map((p) => p.value), 1);
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (i: number) =>
    pad.l + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const area = `${line} L ${x(points.length - 1)} ${pad.t + innerH} L ${x(0)} ${pad.t + innerH} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="crmArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#crmArea)" />
      <path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="3" fill="#6366f1" />
          <text x={x(i)} y={H - 5} textAnchor="middle" className="fill-slate-400 text-[9px]">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function KpiCard({ label, value, gradient }: { label: string; value: string; gradient: string }) {
  return (
    <div className={`rounded-xl p-4 text-white shadow-sm ${gradient}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

// Heatmap background: 0 → faint, 1 → strong, in the given hue.
function heat(v: number, max: number, hue: string): string {
  const t = max > 0 ? Math.min(1, v / max) : 0;
  const map: Record<string, string> = {
    emerald: `rgba(16,185,129,${0.08 + t * 0.45})`,
    sky: `rgba(14,165,233,${0.08 + t * 0.45})`,
    amber: `rgba(245,158,11,${0.08 + t * 0.45})`,
    rose: `rgba(244,63,94,${0.08 + t * 0.45})`,
  };
  return map[hue] ?? "transparent";
}

export default function AdminCrmDashboard() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } = useAdminPermissions();
  const canView = has("customers.view") || has("leads.view");

  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [byStage, setByStage] = useState<StageRow[]>([]);
  const [byOwner, setByOwner] = useState<OwnerRow[]>([]);
  const [monthly, setMonthly] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token ?? "";
      const res = await fetch("/api/admin/crm-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        setKpis(json.kpis);
        setByStage(json.byStage);
        setByOwner(json.byOwner);
        setMonthly(json.monthly);
      }
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  const donutSegments = useMemo(
    () =>
      byStage
        .filter((s) => s.count > 0)
        .map((s) => ({
          label: STAGE_META[s.stage]?.label ?? s.stage,
          value: s.count,
          color: STAGE_META[s.stage]?.color ?? "#94a3b8",
        })),
    [byStage],
  );
  const totalDeals = byStage.reduce((s, x) => s + x.count, 0);
  const maxOwnerValue = Math.max(...byOwner.map((o) => o.won_value), 1);
  const maxOwnerDeals = Math.max(...byOwner.map((o) => o.deals), 1);

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }
  if (!authEmail || !isAdmin || !canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>leads.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="analytics"
      breadcrumbs={[{ label: "CRM Dashboard" }]}
      title="CRM Dashboard"
      subtitle="Pipeline, win rate and team performance at a glance"
      email={authEmail}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : !kpis ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No deal data yet.</p>
      ) : (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Pipeline value" value={inr(kpis.pipeline_value)} gradient="bg-gradient-to-br from-indigo-500 to-violet-600" />
            <KpiCard label="Won value" value={inr(kpis.won_value)} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
            <KpiCard label="Win rate" value={`${kpis.win_rate.toFixed(1)}%`} gradient="bg-gradient-to-br from-sky-500 to-blue-600" />
            <KpiCard label="Open deals" value={String(kpis.open_deals)} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
            <KpiCard label="Weighted value" value={inr(kpis.weighted_value)} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
            <KpiCard label="Avg deal size" value={inr(kpis.avg_deal_value)} gradient="bg-gradient-to-br from-fuchsia-500 to-pink-600" />
          </div>

          {/* Donut + line row */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Pipeline by stage */}
            <section className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Sales pipeline · by stage
              </p>
              <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <div className="relative">
                  <Donut segments={donutSegments} />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black tabular-nums">{totalDeals}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">deals</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-1.5">
                  {byStage.filter((s) => s.count > 0).map((s) => (
                    <li key={s.stage} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: STAGE_META[s.stage]?.color }} />
                        {STAGE_META[s.stage]?.label ?? s.stage}
                      </span>
                      <span className="font-bold tabular-nums">
                        {s.count}
                        <span className={`ml-1.5 font-medium ${adminMutedCls}`}>{inr(s.value)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Won trend */}
            <section className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Won value · last 8 months
              </p>
              <p className="mt-0.5 text-xl font-black tabular-nums">{inr(kpis.won_value)}</p>
              <div className="mt-2">
                <LineChart points={monthly.map((m) => ({ label: m.label, value: m.won_value }))} />
              </div>
            </section>
          </div>

          {/* Team performance heatmap table */}
          <section className={`${adminCardCls} overflow-hidden`}>
            <p className="border-b border-slate-200 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Team performance
            </p>
            {byOwner.length === 0 ? (
              <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No owners yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="px-4 py-2 font-bold">Owner</th>
                      <th className="px-3 py-2 text-right font-bold">Won value</th>
                      <th className="px-3 py-2 text-right font-bold">Deals</th>
                      <th className="px-3 py-2 text-right font-bold">Open</th>
                      <th className="px-3 py-2 text-right font-bold">Won</th>
                      <th className="px-3 py-2 text-right font-bold">Lost</th>
                      <th className="px-3 py-2 text-right font-bold">Win rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byOwner.map((o) => (
                      <tr key={o.owner} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                        <td className="px-4 py-2 font-bold">{o.owner}</td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums" style={{ background: heat(o.won_value, maxOwnerValue, "emerald") }}>
                          {inr(o.won_value)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ background: heat(o.deals, maxOwnerDeals, "sky") }}>
                          {o.deals}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{o.open}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{o.won}</td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ background: heat(o.lost, Math.max(...byOwner.map((x) => x.lost), 1), "rose") }}>
                          {o.lost}
                        </td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums" style={{ background: heat(o.win_rate, 100, "amber") }}>
                          {o.win_rate.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}
