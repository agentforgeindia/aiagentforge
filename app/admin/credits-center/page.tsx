"use client";

// /admin/credits-center — Credits purchased, consumed, balances, adjustments.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Gem, TrendingDown, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls,
  adminMutedCls,
  adminSecondaryBtnCls,
  adminPrimaryBtnCls,
  adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Consumer = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  plan: string | null;
  balance: number;
  consumed: number;
};

type TxnRow = {
  id: string;
  user_id: string;
  email: string | null;
  delta: number;
  reason: string;
  balance_after: number;
  created_at: string;
};

type Metrics = {
  balances: {
    total_in_circulation: number;
    total_users_with_credits: number;
    highest_balance: number;
  };
  purchased: {
    total_purchased: number;
    purchased_today: number;
    purchased_week: number;
    purchased_month: number;
  };
  consumed: {
    total_consumed: number;
    consumed_today: number;
    consumed_week: number;
    consumed_month: number;
    total_refunded: number;
    total_manual_added: number;
  };
  top_consumers: Consumer[];
  recent_txns: TxnRow[];
  error?: string;
};

export default function CreditsCenterPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("credits.view");
  const canAdjust = has("credits.adjust");

  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Manual adjustment state
  const [adjEmail, setAdjEmail] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjMsg, setAdjMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("credits_overview_metrics");
      setData(m as Metrics);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjEmail || !adjAmount || !adjReason) return;
    setAdjSaving(true);
    setAdjMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const jwt = sess.session?.access_token;
      const res = await fetch("/api/admin/payments/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          user_id: adjEmail,
          plan: "manual_credit_adjustment",
          amount: 0,
          credits_added: Math.abs(parseInt(adjAmount)),
          credit_user: true,
          razorpay_payment_id: `manual_adj:${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAdjMsg("Credits adjusted successfully.");
        setAdjEmail(""); setAdjAmount(""); setAdjReason("");
        setRefreshKey((k) => k + 1);
      } else {
        setAdjMsg(json.error ?? "Failed.");
      }
    } catch {
      setAdjMsg("Network error.");
    }
    setAdjSaving(false);
  }

  if (pLoading) return <Loading />;
  if (!canView) return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Credits" }]}
      title="Credit Center"
      subtitle="Purchased, consumed, balances, and manual adjustments"
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
          {/* Hero */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="In Circulation"
              value={data.balances.total_in_circulation.toLocaleString("en-IN")}
              sub={`${data.balances.total_users_with_credits} users`}
              icon={<Gem className="h-4 w-4" />}
            />
            <StatCard
              label="Purchased This Month"
              value={data.purchased.purchased_month.toLocaleString("en-IN")}
              sub={`Today: ${data.purchased.purchased_today.toLocaleString("en-IN")}`}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="emerald"
            />
            <StatCard
              label="Consumed This Month"
              value={data.consumed.consumed_month.toLocaleString("en-IN")}
              sub={`Today: ${data.consumed.consumed_today.toLocaleString("en-IN")}`}
              icon={<TrendingDown className="h-4 w-4" />}
            />
            <StatCard
              label="Total Refunded"
              value={data.consumed.total_refunded.toLocaleString("en-IN")}
              sub={`Manual added: ${data.consumed.total_manual_added.toLocaleString("en-IN")}`}
              icon={<Users className="h-4 w-4" />}
              tone="amber"
            />
          </section>

          {/* Purchased breakdown */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Credits Purchased
            </p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-4">
              {[
                { label: "Today", val: data.purchased.purchased_today },
                { label: "This Week", val: data.purchased.purchased_week },
                { label: "This Month", val: data.purchased.purchased_month },
                { label: "All Time", val: data.purchased.total_purchased },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {s.label}
                  </dt>
                  <dd className="mt-0.5 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                    {s.val.toLocaleString("en-IN")}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Top consumers + Recent transactions */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className={`${adminCardCls} overflow-hidden`}>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Top Credit Consumers
                </p>
              </div>
              {data.top_consumers.length === 0 ? (
                <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No data.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.top_consumers.map((c) => (
                    <li key={c.user_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{c.full_name ?? c.email ?? c.user_id.slice(0, 8)}</p>
                        <p className={`text-[11px] ${adminMutedCls}`}>{c.plan ?? "—"} · Balance: {c.balance.toLocaleString("en-IN")}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-rose-600 dark:text-rose-300 tabular-nums">
                        −{c.consumed.toLocaleString("en-IN")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`${adminCardCls} overflow-hidden`}>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Credit Ledger — Latest 30
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Date</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">User</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Description</th>
                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Amount</th>
                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="max-h-80 divide-y divide-slate-100 dark:divide-slate-800">
                    {data.recent_txns.map((t) => {
                      const isCredit = t.delta > 0;
                      const reasonLabel = t.reason
                        .replace(/_/g, " ")
                        .replace(/generate$/, "generation")
                        .replace(/^refund:?/, "Refund —")
                        .replace(/^manual/, "Manual adjustment");
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className={`px-4 py-2 ${adminMutedCls}`}>
                            {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </td>
                          <td className="max-w-[120px] px-4 py-2">
                            <p className="truncate font-medium">{t.email ?? t.user_id.slice(0, 8)}</p>
                          </td>
                          <td className="max-w-[160px] px-4 py-2">
                            <p className="truncate capitalize">{reasonLabel}</p>
                          </td>
                          <td className={`px-4 py-2 text-right font-bold tabular-nums ${isCredit ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                            {isCredit ? "+" : ""}{t.delta.toLocaleString("en-IN")}
                          </td>
                          <td className={`px-4 py-2 text-right tabular-nums ${adminMutedCls}`}>
                            {t.balance_after.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Manual adjustment */}
          {canAdjust && (
            <section className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Manual Credit Adjustment
              </p>
              <form onSubmit={handleAdjust} className="mt-3 grid gap-3 sm:grid-cols-4">
                <input
                  className={adminInputCls}
                  placeholder="User ID or email"
                  value={adjEmail}
                  onChange={(e) => setAdjEmail(e.target.value)}
                />
                <input
                  className={adminInputCls}
                  placeholder="Credits (e.g. 500)"
                  type="number"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                />
                <input
                  className={adminInputCls}
                  placeholder="Reason"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                />
                <button type="submit" disabled={adjSaving} className={adminPrimaryBtnCls}>
                  {adjSaving ? "Saving…" : "Add Credits"}
                </button>
              </form>
              {adjMsg && (
                <p className={`mt-2 text-xs ${adjMsg.includes("success") ? "text-emerald-600" : "text-rose-600"}`}>
                  {adjMsg}
                </p>
              )}
            </section>
          )}
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
        <p className="mt-1 text-xs text-slate-500">credits.view permission required.</p>
      </div>
    </main>
  );
}
