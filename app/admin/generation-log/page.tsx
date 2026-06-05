"use client";

// /admin/generation-log — detailed per-generation record viewer.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Row = {
  id: string; agent: string; user_id: string; email: string | null;
  status: string; created_at: string; cost_usd: number; cost_inr: number;
};

const AGENTS = ["", "jewellery", "textile", "productography", "social-ads", "ugc", "trendforge"];
const STATUSES = ["", "completed", "pending", "failed"];

export default function GenerationLogPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("ai_ops.view");

  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent]     = useState("");
  const [status, setStatus]   = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("generation_log", {
        p_limit: 150, p_agent: agent || null, p_status: status || null,
      });
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, [canView, agent, status, refreshKey]);

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const totalCost = rows.reduce((s, r) => s + (r.cost_inr || 0), 0);

  return (
    <AdminShell
      breadcrumbs={[{ label: "AI Operations", href: "/admin/ai-operations" }, { label: "Generation Log" }]}
      title="Generation Log"
      subtitle="Every generation — agent, user, status, cost to company"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select className={adminInputCls} value={agent} onChange={(e) => setAgent(e.target.value)}>
          {AGENTS.map((a) => <option key={a} value={a}>{a ? a : "All Agents"}</option>)}
        </select>
        <select className={adminInputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s : "All Status"}</option>)}
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {["Generation ID", "Agent", "User", "Status", "Cost", "Date"].map((h) => (
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
