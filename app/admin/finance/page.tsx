"use client";

// /admin/finance â€” Revenue, expenses, and net profit.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, TrendingUp, Minus, DollarSign, Plus, Trash2, Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls,
  adminMutedCls,
  adminSecondaryBtnCls,
  adminPrimaryBtnCls,
  adminInputCls,
  adminGhostBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type MonthRow = { m: string; revenue: number; expense: number; profit: number };

type ExpenseRow = {
  id: string;
  category: string;
  label: string;
  amount_inr: number;
  expense_date: string;
  notes: string | null;
};

type Metrics = {
  revenue: { lifetime: number; today: number; week: number; month: number; year: number };
  refunds: { total_refunded: number };
  expenses: {
    total: number; this_month: number;
    hosting: number; api_cost: number; salary: number;
    meta_ads: number; google_ads: number; software: number; other: number;
  };
  net_profit_month: number;
  monthly: MonthRow[];
  recent_expenses: ExpenseRow[];
  error?: string;
};

const CATEGORIES = [
  { value: "hosting",    label: "Hosting" },
  { value: "api_cost",   label: "API Cost" },
  { value: "salary",     label: "Salary" },
  { value: "meta_ads",   label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "software",   label: "Software" },
  { value: "other",      label: "Other" },
];

export default function FinancePage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("finance.view");
  const canEdit = has("finance.edit");

  const [data, setData]           = useState<Metrics | null>(null);
  const [agentData, setAgentData] = useState<any | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Add expense form
  const [showForm, setShowForm] = useState(false);
  const [fCategory, setFCategory] = useState("hosting");
  const [fLabel, setFLabel] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [fNotes, setFNotes] = useState("");
  const [fSaving, setFSaving] = useState(false);

  // Cost sync
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const [{ data: m }, { data: a }] = await Promise.all([
        supabase.rpc("finance_metrics"),
        supabase.rpc("revenue_by_agent"),
      ]);
      setData(m as Metrics);
      setAgentData(a);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!fLabel || !fAmount) return;
    setFSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    const { error } = await supabase.from("finance_expenses").insert({
      category: fCategory,
      label: fLabel,
      amount_inr: parseFloat(fAmount),
      expense_date: fDate,
      notes: fNotes || null,
      created_by: userId,
    });
    if (!error) {
      setFLabel(""); setFAmount(""); setFNotes(""); setShowForm(false);
      setRefreshKey((k) => k + 1);
    }
    setFSaving(false);
  }

  async function deleteExpense(id: string) {
    await supabase.from("finance_expenses").delete().eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  async function syncCosts() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/expenses/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${sess.session?.access_token}` },
      });
      const json = await res.json();
      if (json.ok) {
        const ok = json.results.filter((r: any) => r.ok).map((r: any) => r.provider);
        const skipped = json.results.filter((r: any) => !r.ok).map((r: any) => `${r.provider} (${r.note})`);
        setSyncMsg(
          `Synced: ${ok.join(", ") || "none"}.` +
          (skipped.length ? ` Skipped: ${skipped.join("; ")}` : "")
        );
        setRefreshKey((k) => k + 1);
      } else {
        setSyncMsg(json.error ?? "Sync failed.");
      }
    } catch {
      setSyncMsg("Network error.");
    }
    setSyncing(false);
  }

  if (pLoading) return <Loading />;
  if (!canView) return <Denied />;

  return (
    <AdminShell
      doodleType="finance"
      breadcrumbs={[{ label: "Finance" }]}
      title="Finance"
      subtitle="Revenue, expenses, and net profit"
      email={email}
      actions={
        <div className="flex gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              className={adminPrimaryBtnCls}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Expense
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={syncCosts}
              disabled={syncing}
              className={adminSecondaryBtnCls}
              title="Pull Meta Ads, OpenAI and FAL costs into expenses"
            >
              <Bot className={`h-3.5 w-3.5 ${syncing ? "animate-pulse" : ""}`} />
              {syncing ? "Syncingâ€¦" : "Sync Costs"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className={adminSecondaryBtnCls}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loadingâ€¦</p>
      ) : !data || data.error ? (
        <p className="p-6 text-center text-sm text-rose-600">{data?.error ?? "No data"}</p>
      ) : (
        <div className="space-y-4">
          {/* Sync result banner */}
          {syncMsg && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs text-indigo-800 dark:border-indigo-700/40 dark:bg-indigo-500/10 dark:text-indigo-200">
              {syncMsg}
            </div>
          )}

          {/* Add expense form */}
          {showForm && canEdit && (
            <section className={`${adminCardCls} p-4`}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Add Expense
              </p>
              <form onSubmit={handleAddExpense} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <select
                  className={adminInputCls}
                  value={fCategory}
                  onChange={(e) => setFCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <input className={adminInputCls} placeholder="Label (e.g. Hetzner VPS)" value={fLabel} onChange={(e) => setFLabel(e.target.value)} required />
                <input className={adminInputCls} placeholder="Amount (â‚¹)" type="number" value={fAmount} onChange={(e) => setFAmount(e.target.value)} required />
                <input className={adminInputCls} type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} />
                <input className={adminInputCls} placeholder="Notes (optional)" value={fNotes} onChange={(e) => setFNotes(e.target.value)} />
                <button type="submit" disabled={fSaving} className={adminPrimaryBtnCls}>
                  {fSaving ? "Savingâ€¦" : "Save"}
                </button>
              </form>
            </section>
          )}

          {/* Hero stats */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue This Month"
              value={`â‚¹${data.revenue.month.toLocaleString("en-IN")}`}
              sub={`Today: â‚¹${data.revenue.today.toLocaleString("en-IN")}`}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="emerald"
            />
            <StatCard
              label="Expenses This Month"
              value={`â‚¹${data.expenses.this_month.toLocaleString("en-IN")}`}
              sub={`All time: â‚¹${data.expenses.total.toLocaleString("en-IN")}`}
              icon={<Minus className="h-4 w-4" />}
              tone="rose"
            />
            <StatCard
              label="Net Profit This Month"
              value={`â‚¹${data.net_profit_month.toLocaleString("en-IN")}`}
              sub={`Refunds: â‚¹${data.refunds.total_refunded.toLocaleString("en-IN")}`}
              icon={<DollarSign className="h-4 w-4" />}
              tone={data.net_profit_month >= 0 ? "emerald" : "rose"}
            />
            <StatCard
              label="Revenue This Year"
              value={`â‚¹${data.revenue.year.toLocaleString("en-IN")}`}
              sub={`Lifetime: â‚¹${data.revenue.lifetime.toLocaleString("en-IN")}`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </section>

          {/* Expense breakdown + Monthly chart */}
          <section className="grid gap-4 lg:grid-cols-2">
            {/* Expense categories */}
            <div className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Expense Breakdown (All Time)
              </p>
              <ul className="mt-3 space-y-2">
                {CATEGORIES.map((cat) => {
                  const val = data.expenses[cat.value as keyof typeof data.expenses] as number;
                  const max = Math.max(1, data.expenses.total);
                  const w = Math.round((val / max) * 100);
                  return (
                    <li key={cat.value}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{cat.label}</span>
                        <span className="tabular-nums font-bold">â‚¹{val.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-rose-400 dark:bg-rose-500"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Monthly revenue vs expense */}
            <div className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Revenue vs Expenses Â· Last 6 Months
              </p>
              <div className="mt-4 space-y-3">
                {data.monthly.map((m) => {
                  const maxVal = Math.max(1, ...data.monthly.map((x) => Math.max(x.revenue, x.expense)));
                  return (
                    <div key={m.m}>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${adminMutedCls}`}>
                          {new Date(m.m + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                        </span>
                        <span className={`text-xs font-bold tabular-nums ${m.profit >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                          {m.profit >= 0 ? "+" : ""}â‚¹{m.profit.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-1">
                        <div
                          className="h-2 rounded-full bg-emerald-400"
                          style={{ width: `${Math.round((m.revenue / maxVal) * 100)}%` }}
                          title={`Revenue: â‚¹${m.revenue.toLocaleString("en-IN")}`}
                        />
                      </div>
                      <div className="mt-0.5 flex gap-1">
                        <div
                          className="h-2 rounded-full bg-rose-300"
                          style={{ width: `${Math.round((m.expense / maxVal) * 100)}%` }}
                          title={`Expense: â‚¹${m.expense.toLocaleString("en-IN")}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-4 text-[11px]">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-full bg-emerald-400" />Revenue</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-full bg-rose-300" />Expenses</span>
              </div>
            </div>
          </section>

          {/* Revenue by Agent */}
          {agentData?.agents && agentData.agents.length > 0 && (
            <section className={`${adminCardCls} p-4`}>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <Bot className="h-3.5 w-3.5" />
                Revenue Attribution by AI Agent (This Month)
              </p>
              <p className={`mt-1 text-[11px] ${adminMutedCls}`}>
                Based on credit consumption Ã— revenue per credit (â‚¹{Number(agentData.revenue_per_credit ?? 0).toFixed(2)}/credit)
              </p>
              <div className="mt-4 space-y-3">
                {agentData.agents.filter((a: any) => a.agent_slug !== 'other').map((a: any) => {
                  const maxRev = Math.max(1, ...agentData.agents.map((x: any) => x.revenue_month));
                  const w = Math.round((a.revenue_month / maxRev) * 100);
                  const AGENT_NAMES: Record<string, string> = {
                    jewellery: "ðŸ’Ž Jewellery AI", textile: "ðŸ§µ Textile AI",
                    productography: "ðŸ“¸ Productography AI", "social-ads": "ðŸ“¢ Social Ads",
                    ugc: "ðŸŽ¬ UGC Forge", trendforge: "ðŸ“ˆ TrendForge",
                  };
                  return (
                    <div key={a.agent_slug}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{AGENT_NAMES[a.agent_slug] ?? a.agent_slug}</span>
                        <div className="flex items-center gap-3 tabular-nums">
                          <span className={adminMutedCls}>{a.credits_month?.toLocaleString("en-IN")} credits</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-300">â‚¹{Number(a.revenue_month ?? 0).toLocaleString("en-IN")}</span>
                          <span className={`text-[10px] ${adminMutedCls}`}>{a.share_pct}%</span>
                        </div>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent expenses table */}
          <section className={`${adminCardCls} overflow-hidden`}>
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Recent Expenses
              </p>
            </div>
            {data.recent_expenses.length === 0 ? (
              <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No expenses logged yet.</p>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Date", "Category", "Label", "Amount", "Notes", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recent_expenses.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 text-xs">{new Date(ex.expense_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium dark:bg-slate-800">
                          {CATEGORIES.find((c) => c.value === ex.category)?.label ?? ex.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium">{ex.label}</td>
                      <td className="px-4 py-2.5 tabular-nums text-xs font-bold text-rose-600 dark:text-rose-300">
                        â‚¹{ex.amount_inr.toLocaleString("en-IN")}
                      </td>
                      <td className={`px-4 py-2.5 text-xs ${adminMutedCls}`}>{ex.notes ?? "â€”"}</td>
                      <td className="px-4 py-2.5">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => deleteExpense(ex.id)}
                            className={adminGhostBtnCls}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
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
      Checking accessâ€¦
    </main>
  );
}
function Denied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-base font-bold">Access denied</h1>
        <p className="mt-1 text-xs text-slate-500">finance.view permission required.</p>
      </div>
    </main>
  );
}



