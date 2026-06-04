"use client";

// /admin/incentives — Incentive Engine: targets, commissions, achievements.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Trophy, Target, IndianRupee, TrendingUp, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Rule      = { plan_name: string; amount_inr: number; percent_pct: number | null; notes: string | null };
type Performer = { member_email: string; deals: number; revenue: number; target: number; achievement_pct: number | null; incentive_earned: number };
type Overview  = { month: string; rules: Rule[]; performance: Performer[]; total_revenue: number; total_incentive_paid: number };

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  pro:     "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  empire:  "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  custom:  "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
};

function progressColor(pct: number | null): string {
  if (pct === null) return "bg-slate-300";
  if (pct >= 100)   return "bg-emerald-500";
  if (pct >= 70)    return "bg-blue-500";
  if (pct >= 40)    return "bg-amber-500";
  return "bg-rose-500";
}

export default function IncentivesPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("incentives.view");
  const canManage = has("incentives.manage");

  const [data, setData]         = useState<Overview | null>(null);
  const [loading, setLoading]   = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [refreshKey, setRefreshKey] = useState(0);

  // Target edit state
  const [editTargets, setEditTargets] = useState<Record<string, string>>({});
  const [savingTarget, setSavingTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("incentive_overview", { p_month: selectedMonth + "-01" });
      setData(m as Overview);
      setLoading(false);
    })();
  }, [canView, selectedMonth, refreshKey]);

  async function saveTarget(memberEmail: string) {
    const val = parseFloat(editTargets[memberEmail]);
    if (isNaN(val)) return;
    setSavingTarget(memberEmail);
    await supabase.from("sales_targets").upsert({
      member_email: memberEmail,
      month: selectedMonth + "-01",
      target_inr: val,
      updated_at: new Date().toISOString(),
    }, { onConflict: "member_email,month" });
    setSavingTarget(null);
    setEditTargets((p) => { const n = { ...p }; delete n[memberEmail]; return n; });
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Incentives" }]}
      title="Incentive Engine"
      subtitle="Commission rules, targets, achievements"
      email={email}
      actions={
        <div className="flex items-center gap-2">
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900" />
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : !data ? (
        <p className="p-6 text-center text-sm text-rose-600">No data</p>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <section className="grid gap-3 sm:grid-cols-3">
            <div className={`${adminCardCls} p-4`}>
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}><IndianRupee className="h-3.5 w-3.5"/>Total Revenue</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">₹{data.total_revenue.toLocaleString("en-IN")}</p>
            </div>
            <div className={`${adminCardCls} p-4`}>
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}><Trophy className="h-3.5 w-3.5"/>Incentive Pool</p>
              <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-300 tabular-nums">₹{data.total_incentive_paid.toLocaleString("en-IN")}</p>
            </div>
            <div className={`${adminCardCls} p-4`}>
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}><TrendingUp className="h-3.5 w-3.5"/>Team Members</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{data.performance.length}</p>
            </div>
          </section>

          {/* Commission Rules */}
          <section className={`${adminCardCls} p-4`}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Commission Rules</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {data.rules.map((r) => (
                <div key={r.plan_name} className={`rounded-lg px-4 py-3 ${PLAN_COLORS[r.plan_name.toLowerCase()] ?? "bg-slate-100"}`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] capitalize">{r.plan_name}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">₹{r.amount_inr.toLocaleString("en-IN")}</p>
                  {r.notes && <p className="mt-0.5 text-[11px] opacity-75">{r.notes}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Performance Cards */}
          {data.performance.length === 0 ? (
            <div className={`${adminCardCls} p-8 text-center`}>
              <Target className="mx-auto h-8 w-8 text-slate-300" />
              <p className={`mt-2 text-sm ${adminMutedCls}`}>No sales data this month yet.</p>
            </div>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.performance.map((p, i) => {
                const pct = p.achievement_pct ?? 0;
                const name = p.member_email.split("@")[0];
                const targetVal = editTargets[p.member_email] ?? String(p.target || "");
                return (
                  <div key={p.member_email} className={`${adminCardCls} p-4`}>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {i === 0 && <span className="text-lg">🥇</span>}
                          {i === 1 && <span className="text-lg">🥈</span>}
                          {i === 2 && <span className="text-lg">🥉</span>}
                          <p className="font-bold capitalize">{name}</p>
                        </div>
                        <p className={`text-[11px] ${adminMutedCls}`}>{p.member_email}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${pct >= 100 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : pct >= 70 ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
                        {pct > 0 ? `${pct}%` : "No target"}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {p.target > 0 && (
                      <div className="mt-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full transition-all ${progressColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px]">
                          <span className={adminMutedCls}>₹{p.revenue.toLocaleString("en-IN")} achieved</span>
                          <span className={adminMutedCls}>Target ₹{p.target.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div>
                        <dt className={`text-[10px] font-bold uppercase ${adminMutedCls}`}>Deals</dt>
                        <dd className="mt-0.5 text-sm font-bold">{p.deals}</dd>
                      </div>
                      <div>
                        <dt className={`text-[10px] font-bold uppercase ${adminMutedCls}`}>Revenue</dt>
                        <dd className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-300">₹{p.revenue.toLocaleString("en-IN")}</dd>
                      </div>
                      <div>
                        <dt className={`text-[10px] font-bold uppercase ${adminMutedCls}`}>Incentive</dt>
                        <dd className="mt-0.5 text-sm font-bold text-indigo-600 dark:text-indigo-300">₹{p.incentive_earned.toLocaleString("en-IN")}</dd>
                      </div>
                    </dl>

                    {/* Set target */}
                    {canManage && (
                      <div className="mt-3 flex gap-2">
                        <input
                          className={`${adminInputCls} flex-1`}
                          placeholder={`Set target (₹)`}
                          type="number"
                          value={targetVal}
                          onChange={(e) => setEditTargets((prev) => ({ ...prev, [p.member_email]: e.target.value }))}
                        />
                        {editTargets[p.member_email] && (
                          <button type="button" onClick={() => saveTarget(p.member_email)} disabled={savingTarget === p.member_email} className={adminPrimaryBtnCls}>
                            <Save className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-base font-bold">Access denied</h1>
        <p className="mt-1 text-xs text-slate-500">incentives.view permission required.</p>
      </div>
    </main>
  );
}
