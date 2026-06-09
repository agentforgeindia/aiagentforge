"use client";

// /admin/command â€” Founder Command Center (founder only).
// Live numbers, monthly goals/targets, cash-in-bank, team productivity.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, IndianRupee, Wallet, AlertCircle, Target, Save, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Live = {
  revenue_today: number; revenue_month: number; cash_in_bank: number;
  outstanding: number; lifetime_revenue: number; active_subs: number;
};
type Goals = {
  revenue_target: number; revenue_actual: number; revenue_pct: number | null;
  customers_target: number; customers_actual: number; customers_pct: number | null;
  generations_target: number; generations_actual: number; generations_pct: number | null;
};
type TeamRow = { member: string; leads: number; won: number };
type Data = { live: Live; goals: Goals; team: TeamRow[]; error?: string };

export default function CommandCenterPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  // Founder-only cockpit — wildcard permission only.
  const canView = has("*");

  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // editable
  const [cash, setCash]       = useState("");
  const [revT, setRevT]       = useState("");
  const [custT, setCustT]     = useState("");
  const [genT, setGenT]       = useState("");
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("founder_command_metrics");
      setData(m as Data);
      if (m && !(m as Data).error) {
        setCash(String((m as Data).live.cash_in_bank || ""));
        setRevT(String((m as Data).goals.revenue_target || ""));
        setCustT(String((m as Data).goals.customers_target || ""));
        setGenT(String((m as Data).goals.generations_target || ""));
      }
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function saveTargets() {
    setSaving(true);
    const month = new Date().toISOString().slice(0, 8) + "01";
    const { data: sess } = await supabase.auth.getSession();
    // Cash in bank â†’ system_settings
    await supabase.from("system_settings").upsert({
      key: "finance.cash_in_bank", value: Number(cash) || 0,
      updated_by: sess.session?.user?.id, updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    // Goals â†’ founder_goals
    await supabase.from("founder_goals").upsert({
      month,
      revenue_target: Number(revT) || 0,
      customers_target: Number(custT) || 0,
      generations_target: Number(genT) || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: "month" });
    setSaving(false);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Command Center" }]}
      title="Founder Command Center"
      subtitle="Live numbers, monthly goals, cash position, team output"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </button>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loadingâ€¦</p>
      ) : !data || data.error ? (
        <p className="p-6 text-center text-sm text-rose-600">{data?.error ?? "No data"}</p>
      ) : (
        <div className="space-y-4">
          {/* Live numbers â€” dark hero */}
          <section className="rounded-xl bg-gradient-to-br from-slate-900 to-[#0e1117] p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300">Live Numbers</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Hero label="Revenue Today"   value={`₹${data.live.revenue_today.toLocaleString("en-IN")}`} color="text-emerald-400" icon={<IndianRupee className="h-3.5 w-3.5" />} />
              <Hero label="Revenue Month"   value={`₹${data.live.revenue_month.toLocaleString("en-IN")}`} color="text-emerald-400" icon={<TrendingUp className="h-3.5 w-3.5" />} />
              <Hero label="Cash in Bank"    value={`₹${data.live.cash_in_bank.toLocaleString("en-IN")}`}  color="text-sky-400"     icon={<Wallet className="h-3.5 w-3.5" />} />
              <Hero label="Outstanding"     value={`₹${data.live.outstanding.toLocaleString("en-IN")}`}   color="text-amber-400"   icon={<AlertCircle className="h-3.5 w-3.5" />} />
              <Hero label="Active Subs"     value={data.live.active_subs}                                 color="text-violet-400" />
              <Hero label="Lifetime"        value={`₹${data.live.lifetime_revenue.toLocaleString("en-IN")}`} color="text-white" />
            </div>
          </section>

          {/* Goals */}
          <section className="grid gap-4 lg:grid-cols-3">
            <GoalCard label="Revenue Target"     actual={`₹${data.goals.revenue_actual.toLocaleString("en-IN")}`} target={`₹${data.goals.revenue_target.toLocaleString("en-IN")}`} pct={data.goals.revenue_pct} />
            <GoalCard label="New Customers"      actual={String(data.goals.customers_actual)} target={String(data.goals.customers_target)} pct={data.goals.customers_pct} />
            <GoalCard label="AI Generations"     actual={data.goals.generations_actual.toLocaleString("en-IN")} target={data.goals.generations_target.toLocaleString("en-IN")} pct={data.goals.generations_pct} />
          </section>

          {/* Set targets */}
          <section className={`${adminCardCls} p-4`}>
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <Target className="h-3.5 w-3.5" />Set This Month's Targets &amp; Cash
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Cash in Bank (₹)"      value={cash}  onChange={setCash} />
              <Field label="Revenue Target (₹)"    value={revT}  onChange={setRevT} />
              <Field label="Customers Target"      value={custT} onChange={setCustT} />
              <Field label="Generations Target"    value={genT}  onChange={setGenT} />
            </div>
            <button type="button" onClick={saveTargets} disabled={saving} className={`${adminPrimaryBtnCls} mt-3`}>
              <Save className="h-3.5 w-3.5" />{saving ? "Savingâ€¦" : "Save Targets"}
            </button>
          </section>

          {/* Team productivity */}
          <section className={`${adminCardCls} overflow-hidden`}>
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Team Productivity (This Month)</p>
            </div>
            {data.team.length === 0 ? (
              <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No lead activity yet.</p>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Member", "Leads Added", "Deals Won", "Conversion"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.team.map((m) => {
                    const conv = m.leads > 0 ? Math.round((m.won / m.leads) * 100) : 0;
                    return (
                      <tr key={m.member} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 text-xs font-medium">{m.member === "unassigned" ? "Unassigned" : m.member.split("@")[0]}</td>
                        <td className="px-4 py-2.5 tabular-nums text-xs">{m.leads}</td>
                        <td className="px-4 py-2.5 tabular-nums text-xs font-bold text-emerald-600 dark:text-emerald-300">{m.won}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${conv >= 30 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : conv >= 10 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{conv}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Hero({ label, value, color, icon }: { label: string; value: string | number; color: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className={`text-lg font-bold tabular-nums sm:text-xl ${color}`}>{value}</p>
      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{icon}{label}</p>
    </div>
  );
}

function GoalCard({ label, actual, target, pct }: { label: string; actual: string; target: string; pct: number | null }) {
  const p = pct ?? 0;
  const bar = p >= 100 ? "bg-emerald-500" : p >= 60 ? "bg-blue-500" : p >= 30 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className={`${adminCardCls} p-4`}>
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`text-sm font-bold ${p >= 100 ? "text-emerald-600 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>{pct !== null ? `${p}%` : "No target"}</span>
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums">{actual}</p>
      <p className={`text-[11px] ${adminMutedCls}`}>of {target} target</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(p, 100)}%` }} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</label>
      <input className={`${adminInputCls} mt-1`} type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking accessâ€¦</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Founder only</h1>
      </div>
    </main>
  );
}


