"use client";

// /admin/error-logs — System errors: generation, API, webhook, payment.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, AlertTriangle, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type ErrRow = { id: string; category: string; source: string | null; message: string; resolved: boolean; created_at: string };
type Counts = { total: number; unresolved: number; today: number; payment: number; webhook: number; generation: number };
type Data = { counts: Counts; recent: ErrRow[] };

const CAT_COLORS: Record<string, string> = {
  generation: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  api:        "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  webhook:    "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  payment:    "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  email:      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  whatsapp:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  other:      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function ErrorLogsPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("audit.view");

  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("error_log_summary", { p_limit: 150 });
      setData(m as Data);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function resolve(id: string) {
    await supabase.from("error_logs").update({ resolved: true }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const recent = data?.recent.filter((r) =>
    filter === "all" ? true : filter === "unresolved" ? !r.resolved : r.category === filter
  ) ?? [];

  return (
    <AdminShell
      breadcrumbs={[{ label: "Error Logs" }]}
      title="Error Logs"
      subtitle="System failures — generation, API, webhook, payment errors"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </button>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : !data ? (
        <p className="p-6 text-center text-sm text-rose-600">No data</p>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Unresolved"  value={data.counts.unresolved} tone={data.counts.unresolved > 0 ? "rose" : "emerald"} />
            <Stat label="Today"        value={data.counts.today} />
            <Stat label="Payment"      value={data.counts.payment}    tone={data.counts.payment > 0 ? "rose" : undefined} />
            <Stat label="Webhook"      value={data.counts.webhook}    tone={data.counts.webhook > 0 ? "amber" : undefined} />
            <Stat label="Generation"   value={data.counts.generation} tone={data.counts.generation > 0 ? "amber" : undefined} />
            <Stat label="Total"        value={data.counts.total} />
          </section>

          {/* Filter */}
          <div className="flex flex-wrap gap-1.5">
            {["all", "unresolved", "payment", "webhook", "generation", "api", "email"].map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition ${filter === f ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <section className={`${adminCardCls} overflow-hidden`}>
            {recent.length === 0 ? (
              <div className="p-10 text-center">
                <Check className="mx-auto h-8 w-8 text-emerald-400" />
                <p className={`mt-2 text-sm ${adminMutedCls}`}>No errors — all clear!</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${r.resolved ? "text-slate-300" : "text-rose-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CAT_COLORS[r.category] ?? CAT_COLORS.other}`}>{r.category}</span>
                        {r.source && <span className={`text-[11px] font-bold ${adminMutedCls}`}>{r.source}</span>}
                        {r.resolved && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300">RESOLVED</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">{r.message}</p>
                      <p className={`text-[10px] ${adminMutedCls}`}>{new Date(r.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {!r.resolved && (
                      <button type="button" onClick={() => resolve(r.id)} className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                        Resolve
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "rose" | "amber" | "emerald" }) {
  const c = tone === "rose" ? "text-rose-600 dark:text-rose-300" : tone === "amber" ? "text-amber-600 dark:text-amber-300" : tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200";
  return (
    <div className={`${adminCardCls} p-3`}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums ${c}`}>{value}</p>
    </div>
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
