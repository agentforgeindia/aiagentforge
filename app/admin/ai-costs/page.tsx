"use client";

// ============================================================
// /admin/ai-costs — AI generation cost monitoring.
// ============================================================
// Founder/admin/accounts can see:
//   • Spend today / week / month / lifetime (USD + INR)
//   • Per-agent breakdown with failure rate
//   • Top 10 customers (cost vs revenue → margin)
//   • Daily spend trend last 30 days
//   • Editable cost catalogue (per-agent USD cost) + USD↔INR rate
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, RefreshCw, Save, ShieldCheck } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Metrics = {
  spend_usd: { today: number; week: number; month: number; lifetime: number };
  spend_inr: { today: number; week: number; month: number; lifetime: number };
  usd_to_inr_rate: number;
  per_agent: {
    agent_slug: string;
    total: number;
    success: number;
    failed: number;
    cost_usd: number;
    cost_inr: number;
  }[];
  top_customers: {
    user_id: string;
    email: string | null;
    full_name: string | null;
    gens: number;
    cost_usd: number;
    cost_inr: number;
    revenue_inr: number;
    margin_inr: number;
  }[];
  daily: { d: string; cost_usd: number; cost_inr: number }[];
  failure: { agent_slug: string; total: number; failed: number; failure_rate_pct: number }[];
  note?: string;
};

type CatalogueRow = {
  agent_slug: string;
  cost_per_generation_usd: number;
  notes: string | null;
};

export default function AdminAiCostsPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("ai_costs.view");
  const canEdit = has("ai_costs.edit");

  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [catalogue, setCatalogue] = useState<CatalogueRow[]>([]);
  const [editingCatalogue, setEditingCatalogue] = useState(false);
  const [usdRate, setUsdRate] = useState<number>(83.5);
  const [savingCatalogue, setSavingCatalogue] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const [{ data: m }, { data: cat }, { data: settings }] = await Promise.all([
        supabase.rpc("ai_cost_metrics"),
        supabase
          .from("agent_costs")
          .select("agent_slug, cost_per_generation_usd, notes")
          .order("agent_slug"),
        supabase
          .from("ai_cost_settings")
          .select("usd_to_inr_rate")
          .eq("id", 1)
          .maybeSingle(),
      ]);
      setData(m as Metrics | null);
      setCatalogue((cat ?? []) as CatalogueRow[]);
      if (settings?.usd_to_inr_rate) setUsdRate(Number(settings.usd_to_inr_rate));
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function saveCatalogue() {
    setSavingCatalogue(true);
    // Upsert each row, plus the settings rate.
    const promises = catalogue.map((c) =>
      supabase
        .from("agent_costs")
        .upsert({
          agent_slug: c.agent_slug,
          cost_per_generation_usd: Number(c.cost_per_generation_usd),
          notes: c.notes,
          updated_at: new Date().toISOString(),
        }),
    );
    promises.push(
  supabase
    .from("ai_cost_settings")
    .update({
      usd_to_inr_rate: Number(usdRate),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1) as any,
);
    const results = await Promise.all(promises);
    const err = results.find((r) => r.error);
    setSavingCatalogue(false);
    if (err?.error) {
      alert(`Save failed: ${err.error.message}`);
      return;
    }
    setEditingCatalogue(false);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }
  if (!canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>ai_costs.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      breadcrumbs={[{ label: "AI Costs" }]}
      title="AI generation costs"
      subtitle={
        data
          ? `Today ₹${data.spend_inr.today.toLocaleString("en-IN")} · Month ₹${data.spend_inr.month.toLocaleString("en-IN")}`
          : undefined
      }
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
      ) : !data ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>
          No metrics returned.
        </p>
      ) : (
        <div className="space-y-4">
          {data.note && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-500/10 dark:text-amber-200">
              ⚠️ {data.note}
            </div>
          )}

          {/* Spend hero */}
          <section className="grid gap-3 sm:grid-cols-4">
            <SpendStat label="Today"    inr={data.spend_inr.today}    usd={data.spend_usd.today} />
            <SpendStat label="This week" inr={data.spend_inr.week}    usd={data.spend_usd.week} />
            <SpendStat label="This month" inr={data.spend_inr.month}  usd={data.spend_usd.month} />
            <SpendStat label="Lifetime" inr={data.spend_inr.lifetime} usd={data.spend_usd.lifetime} />
          </section>

          {/* Daily spend */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Daily spend · last 30 days
            </p>
            <Sparkbars points={data.daily} />
            <p className={`mt-3 text-[11px] ${adminMutedCls}`}>
              USD-INR rate: ₹{data.usd_to_inr_rate.toFixed(2)} per $1
            </p>
          </section>

          {/* Per agent */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Per-agent spend (lifetime)
            </p>
            {data.per_agent.length === 0 ? (
              <p className={`mt-3 text-sm ${adminMutedCls}`}>
                No generations recorded yet.
              </p>
            ) : (
              <table className="mt-3 w-full text-sm">
                <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <tr className="text-left">
                    <th className="py-1.5">Agent</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Success</th>
                    <th className="text-right">Failed</th>
                    <th className="text-right">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.per_agent.map((a) => (
                    <tr key={a.agent_slug}>
                      <td className="py-2 font-bold capitalize">{a.agent_slug}</td>
                      <td className="text-right tabular-nums">
                        {a.total.toLocaleString("en-IN")}
                      </td>
                      <td className="text-right tabular-nums text-emerald-600">
                        {a.success.toLocaleString("en-IN")}
                      </td>
                      <td className="text-right tabular-nums text-rose-600">
                        {a.failed.toLocaleString("en-IN")}
                      </td>
                      <td className="text-right font-bold tabular-nums">
                        ₹{a.cost_inr.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Top customers — margin analysis */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Top 10 customers by generation volume
            </p>
            {data.top_customers.length === 0 ? (
              <p className={`mt-3 text-sm ${adminMutedCls}`}>
                No customer-level cost data yet.
              </p>
            ) : (
              <table className="mt-3 w-full text-sm">
                <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <tr className="text-left">
                    <th className="py-1.5">Customer</th>
                    <th className="text-right">Gens</th>
                    <th className="text-right">API cost</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.top_customers.map((c) => (
                    <tr key={c.user_id}>
                      <td className="py-2">
                        <Link
                          href={`/admin/customers/${c.user_id}`}
                          className="font-bold hover:text-indigo-600 dark:hover:text-indigo-300"
                        >
                          {c.full_name?.trim() || c.email || "—"}
                        </Link>
                      </td>
                      <td className="text-right tabular-nums">
                        {c.gens.toLocaleString("en-IN")}
                      </td>
                      <td className="text-right tabular-nums text-rose-600">
                        ₹{c.cost_inr.toLocaleString("en-IN")}
                      </td>
                      <td className="text-right tabular-nums text-emerald-600">
                        ₹{c.revenue_inr.toLocaleString("en-IN")}
                      </td>
                      <td
                        className={`text-right font-bold tabular-nums ${
                          c.margin_inr >= 0
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {c.margin_inr >= 0 ? "+" : ""}
                        ₹{c.margin_inr.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Failure rate */}
          {data.failure.length > 0 && (
            <section className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Failure rate · last 30 days
              </p>
              <ul className="mt-3 space-y-2">
                {data.failure.map((f) => (
                  <li key={f.agent_slug}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold capitalize">{f.agent_slug}</span>
                      <span className="tabular-nums">
                        {f.failed} / {f.total}{" "}
                        <span
                          className={
                            f.failure_rate_pct > 10
                              ? "font-bold text-rose-600"
                              : f.failure_rate_pct > 5
                                ? "font-bold text-amber-600"
                                : "text-emerald-600"
                          }
                        >
                          ({f.failure_rate_pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          f.failure_rate_pct > 10
                            ? "bg-rose-500"
                            : f.failure_rate_pct > 5
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, f.failure_rate_pct)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Catalogue editor */}
          <section className={`${adminCardCls} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Cost catalogue
                </p>
                <p className={`mt-1 text-xs ${adminMutedCls}`}>
                  Edit the estimated USD cost per generation. Changes apply
                  retroactively to the metrics above.
                </p>
              </div>
              {canEdit && !editingCatalogue && (
                <button
                  type="button"
                  onClick={() => setEditingCatalogue(true)}
                  className={adminSecondaryBtnCls}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              {canEdit && editingCatalogue && (
                <button
                  type="button"
                  onClick={saveCatalogue}
                  disabled={savingCatalogue}
                  className={adminPrimaryBtnCls}
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingCatalogue ? "Saving…" : "Save"}
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catalogue.map((c, i) => (
                <div
                  key={c.agent_slug}
                  className="rounded-md border border-slate-200 p-3 dark:border-slate-800"
                >
                  <p className="text-xs font-bold capitalize">{c.agent_slug}</p>
                  {editingCatalogue ? (
                    <input
                      type="number"
                      step="0.0001"
                      value={c.cost_per_generation_usd}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setCatalogue((prev) => {
                          const next = [...prev];
                          next[i] = { ...next[i], cost_per_generation_usd: v };
                          return next;
                        });
                      }}
                      className={`${adminInputCls} mt-2`}
                    />
                  ) : (
                    <p className="mt-1 text-base font-bold tabular-nums">
                      ${c.cost_per_generation_usd.toFixed(4)}{" "}
                      <span className={`text-xs ${adminMutedCls}`}>per gen</span>
                    </p>
                  )}
                  {c.notes && (
                    <p className={`mt-1 text-[11px] ${adminMutedCls}`}>{c.notes}</p>
                  )}
                </div>
              ))}
              <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-xs font-bold">USD-INR rate</p>
                {editingCatalogue ? (
                  <input
                    type="number"
                    step="0.01"
                    value={usdRate}
                    onChange={(e) => setUsdRate(Number(e.target.value))}
                    className={`${adminInputCls} mt-2`}
                  />
                ) : (
                  <p className="mt-1 text-base font-bold tabular-nums">
                    ₹{usdRate.toFixed(2)}{" "}
                    <span className={`text-xs ${adminMutedCls}`}>per $1</span>
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function SpendStat({
  label,
  inr,
  usd,
}: {
  label: string;
  inr: number;
  usd: number;
}) {
  return (
    <div className={`${adminCardCls} p-4`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        ₹{inr.toLocaleString("en-IN")}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
        ${usd.toFixed(2)}
      </p>
    </div>
  );
}

function Sparkbars({
  points,
}: {
  points: { d: string; cost_usd: number; cost_inr: number }[];
}) {
  const max = Math.max(1, ...points.map((p) => p.cost_inr));
  return (
    <div className="mt-4 flex h-20 items-end gap-1">
      {points.map((p, i) => {
        const h = Math.max(2, Math.round((p.cost_inr / max) * 100));
        return (
          <div
            key={i}
            title={`${p.d}: ₹${p.cost_inr.toLocaleString("en-IN")}`}
            className="group flex-1 rounded-t bg-slate-200 transition hover:bg-rose-500 dark:bg-slate-700"
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}
