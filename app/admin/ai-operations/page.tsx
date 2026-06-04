"use client";

// /admin/ai-operations — AI generation volume, failures, credits consumed.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Zap, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type AgentRow = {
  agent_slug: string;
  total: number;
  completed: number;
  failed: number;
  today: number;
  failure_pct: number;
};

type FailRow = {
  id: string;
  agent_slug: string;
  user_id: string;
  created_at: string;
};

type DayRow = { d: string; total: number; failed: number };

type Metrics = {
  totals: {
    total_all_time: number;
    total_today: number;
    total_week: number;
    total_month: number;
    failed_all_time: number;
    failed_today: number;
    queued_now: number;
    completed_all_time: number;
  };
  by_agent: AgentRow[];
  credits: {
    total_consumed: number;
    consumed_today: number;
    consumed_week: number;
    consumed_month: number;
  };
  recent_fails: FailRow[];
  daily: DayRow[];
  error?: string;
};

const AGENT_LABELS: Record<string, string> = {
  jewellery: "Jewellery AI",
  textile: "Textile AI",
  productography: "Productography AI",
  "social-ads": "Social Ads",
  ugc: "UGC Forge",
  trendforge: "TrendForge",
  "election-campaign": "Election Campaign",
};

export default function AiOperationsPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("ai_ops.view");

  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("ai_operations_metrics");
      setData(m as Metrics);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  if (pLoading) return <Loading />;
  if (!canView) return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "AI Operations" }]}
      title="AI Operations"
      subtitle="Generation volume, failures, and credit consumption"
      email={email}
      actions={
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className={adminSecondaryBtnCls}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : !data || data.error ? (
        <p className="p-6 text-center text-sm text-rose-600">{data?.error ?? "No data"}</p>
      ) : (
        <div className="space-y-4">
          {/* Hero stats */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Generations"
              value={data.totals.total_all_time.toLocaleString("en-IN")}
              sub={`Today: ${data.totals.total_today.toLocaleString("en-IN")}`}
              icon={<Zap className="h-4 w-4" />}
            />
            <StatCard
              label="This Month"
              value={data.totals.total_month.toLocaleString("en-IN")}
              sub={`This week: ${data.totals.total_week.toLocaleString("en-IN")}`}
              icon={<CheckCircle className="h-4 w-4" />}
              tone="emerald"
            />
            <StatCard
              label="Failed Today"
              value={data.totals.failed_today.toLocaleString("en-IN")}
              sub={`All time: ${data.totals.failed_all_time.toLocaleString("en-IN")}`}
              icon={<AlertTriangle className="h-4 w-4" />}
              tone={data.totals.failed_today > 0 ? "rose" : undefined}
            />
            <StatCard
              label="Queue (Pending)"
              value={data.totals.queued_now.toLocaleString("en-IN")}
              sub="Currently processing"
              icon={<Clock className="h-4 w-4" />}
              tone={data.totals.queued_now > 10 ? "amber" : undefined}
            />
          </section>

          {/* Credits consumed */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Credits Consumed
            </p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-4">
              {[
                { label: "Today", val: data.credits.consumed_today },
                { label: "This Week", val: data.credits.consumed_week },
                { label: "This Month", val: data.credits.consumed_month },
                { label: "All Time", val: data.credits.total_consumed },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {s.label}
                  </dt>
                  <dd className="mt-0.5 text-xl font-bold tabular-nums">
                    {s.val.toLocaleString("en-IN")}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Per-agent breakdown */}
          <section className={`${adminCardCls} overflow-hidden`}>
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Agent Performance
              </p>
            </div>
            {data.by_agent.length === 0 ? (
              <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No generations yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Agent", "Total", "Completed", "Failed", "Today", "Fail %"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.by_agent.map((a) => (
                    <tr key={a.agent_slug} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-medium">
                        {AGENT_LABELS[a.agent_slug] ?? a.agent_slug}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{a.total.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 tabular-nums text-emerald-600 dark:text-emerald-300">
                        {a.completed.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-rose-600 dark:text-rose-300">
                        {a.failed.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{a.today.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            a.failure_pct > 20
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                              : a.failure_pct > 5
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          }`}
                        >
                          {a.failure_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Daily chart + Recent failures */}
          <section className="grid gap-4 lg:grid-cols-2">
            {/* Sparkline */}
            <div className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Daily Generations · Last 30 Days
              </p>
              <DailyChart points={data.daily} />
            </div>

            {/* Recent failures */}
            <div className={`${adminCardCls} overflow-hidden`}>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Recent Failed Jobs · Last 7 Days
                </p>
              </div>
              {data.recent_fails.length === 0 ? (
                <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No failures.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recent_fails.slice(0, 10).map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div>
                        <p className="text-xs font-medium">
                          {AGENT_LABELS[f.agent_slug] ?? f.agent_slug}
                        </p>
                        <p className={`text-[11px] ${adminMutedCls}`}>
                          {f.user_id.slice(0, 8)}…
                        </p>
                      </div>
                      <p className={`text-[11px] ${adminMutedCls}`}>
                        {new Date(f.created_at).toLocaleString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function DailyChart({ points }: { points: DayRow[] }) {
  const max = Math.max(1, ...points.map((p) => p.total));
  return (
    <div className="mt-4 flex h-24 items-end gap-0.5">
      {points.map((p, i) => {
        const h = Math.max(2, Math.round((p.total / max) * 100));
        return (
          <div
            key={i}
            title={`${p.d}: ${p.total} gens, ${p.failed} failed`}
            className="group flex-1 rounded-t bg-indigo-200 transition hover:bg-indigo-500 dark:bg-indigo-800 dark:hover:bg-indigo-500"
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}

function StatCard({
  label, value, sub, icon, tone,
}: {
  label: string; value: string; sub?: string; icon?: React.ReactNode;
  tone?: "emerald" | "rose" | "amber";
}) {
  const accent =
    tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" :
    tone === "rose"    ? "text-rose-600 dark:text-rose-300" :
    tone === "amber"   ? "text-amber-600 dark:text-amber-300" :
                         "text-slate-700 dark:text-slate-200";
  return (
    <div className={`${adminCardCls} p-4`}>
      <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>
        {icon}{label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${accent}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{sub}</p>}
    </div>
  );
}

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
      Checking access…
    </main>
  );
}

function Denied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-base font-bold">Access denied</h1>
        <p className="mt-1 text-xs text-slate-500">ai_ops.view permission required.</p>
      </div>
    </main>
  );
}
