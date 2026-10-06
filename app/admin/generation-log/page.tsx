"use client";

// /admin/generation-log — detailed per-generation record viewer.
// Also shows where each generation was made from (mobile app / mobile
// browser / desktop website) — see app/admin/generationSource.tsx.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { SOURCE_META, SOURCE_ORDER, SourceBadge, SourceSplit, useSourceStats } from "../generationSource";
import { useAdminLang } from "../i18n";

type Row = {
  id: string; agent: string; user_id: string; email: string | null;
  status: string; created_at: string; cost_usd: number; cost_inr: number;
  /** app | mobile_web | web — null for generations made before tracking. */
  source: string | null;
};

const AGENTS = ["", "jewellery", "textile", "productography", "social-ads", "ugc", "trendforge"];
const STATUSES = ["", "completed", "pending", "failed"];
const STATS_DAYS = 30;

export default function GenerationLogPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("ai_ops.view");

  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent]     = useState("");
  const [status, setStatus]   = useState("");
  const [source, setSource]   = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { tl, lang } = useAdminLang();
  const { stats, loading: statsLoading } = useSourceStats(null, STATS_DAYS, refreshKey);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("generation_log_v2", {
        p_limit: 150, p_agent: agent || null, p_status: status || null, p_source: source || null,
      });
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, [canView, agent, status, source, refreshKey]);

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const totalCost = rows.reduce((s, r) => s + (r.cost_inr || 0), 0);

  return (
    <AdminShell
      breadcrumbs={[{ label: "AI Operations", href: "/admin/ai-operations" }, { label: "Generation Log" }]}
      title="Generation Log"
      subtitle="Every generation — agent, user, where it was made from, status, cost to company"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </button>
      }
    >
      {/* Where generations come from — last 30 days, all users */}
      <section className={`${adminCardCls} mb-4 p-4`}>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          {lang === "hi" ? `Generations kahan se ho rahi hain · pichhle ${STATS_DAYS} din` : `Where generations are made from · last ${STATS_DAYS} days`}
        </h2>
        <SourceSplit stats={stats} loading={statsLoading} />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2 [&>select]:w-auto [&>select]:min-w-[9.5rem] [&>select]:flex-1 sm:[&>select]:flex-none">
        <select className={adminInputCls} value={agent} onChange={(e) => setAgent(e.target.value)}>
          {AGENTS.map((a) => <option key={a} value={a}>{a ? a : "All Agents"}</option>)}
        </select>
        <select className={adminInputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s : "All Status"}</option>)}
        </select>
        <select className={adminInputCls} value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source">
          <option value="">{lang === "hi" ? "Sab sources" : "All sources"}</option>
          {SOURCE_ORDER.map((s) => <option key={s} value={s}>{tl(SOURCE_META[s].label)}</option>)}
          <option value="unknown">{lang === "hi" ? "Record nahi (purani)" : "Not recorded (older)"}</option>
        </select>
        <span className={`ml-auto text-xs ${adminMutedCls}`}>
          {rows.length} rows · est. cost <span className="font-bold text-rose-600 dark:text-rose-300">₹{totalCost.toLocaleString("en-IN")}</span>
        </span>
      </div>

      <section className={`${adminCardCls} overflow-hidden`}>
        {loading ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No generations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {["Generation ID", "Agent", "User", "Source", "Status", "Cost", "Date"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className={`px-4 py-2.5 font-mono text-[11px] ${adminMutedCls}`}>{r.id.slice(0, 8)}…</td>
                    <td className="px-4 py-2.5 text-xs font-medium capitalize">{r.agent ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs">{r.email ?? (r.user_id ? r.user_id.slice(0, 8) + "…" : "—")}</td>
                    <td className="px-4 py-2.5"><SourceBadge source={r.source} /></td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" :
                        r.status === "failed"    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-xs text-rose-600 dark:text-rose-300">₹{(r.cost_inr || 0).toFixed(2)}</td>
                    <td className={`px-4 py-2.5 text-[11px] ${adminMutedCls}`}>
                      {new Date(r.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
