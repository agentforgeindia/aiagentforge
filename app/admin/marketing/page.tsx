"use client";

// /admin/marketing â€” Lead sources, campaign performance, email campaigns.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, TrendingUp, Users, Mail, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type SourceRow    = { source: string; total: number; month: number; converted: number };
type DayRow       = { d: string; total: number; meta: number; google: number };
type EmailTplRow  = { template: string; total: number; sent: number; failed: number };

type LeadCounts = {
  total_leads: number; leads_today: number; leads_week: number; leads_month: number;
  meta_leads: number; google_leads: number; instagram_leads: number;
  facebook_leads: number; whatsapp_leads: number; website_leads: number;
  referral_leads: number; converted: number; new_leads: number;
};
type EmailStats = {
  total_sent: number; sent: number; queued: number; failed: number;
  dry_run: number; sent_today: number; sent_month: number;
};
type Metrics = {
  leads: LeadCounts;
  by_source: SourceRow[];
  daily_leads: DayRow[];
  email: EmailStats;
  email_by_template: EmailTplRow[];
  error?: string;
};

const SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook", instagram: "Instagram", google: "Google",
  whatsapp: "WhatsApp", website: "Website", referral: "Referral",
  call: "Phone", event: "Event", other: "Other",
};

const SOURCE_COLORS: Record<string, string> = {
  facebook:  "bg-blue-500",   instagram: "bg-pink-500",
  google:    "bg-emerald-500", whatsapp: "bg-green-500",
  website:   "bg-indigo-500",  referral: "bg-amber-500",
  call:      "bg-slate-500",   other:    "bg-slate-400",
};

export default function MarketingPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("marketing.view");

  const [data, setData]       = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("marketing_metrics");
      setData(m as Metrics);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Marketing" }]}
      title="Marketing Center"
      subtitle="Lead sources, campaign performance, email campaigns"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
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
            <StatCard label="Total Leads"    value={data.leads.total_leads}   sub={`Today: ${data.leads.leads_today}`}  icon={<Users className="h-4 w-4" />} />
            <StatCard label="This Month"     value={data.leads.leads_month}   sub={`This week: ${data.leads.leads_week}`} icon={<TrendingUp className="h-4 w-4" />} tone="emerald" />
            <StatCard label="Meta Leads"     value={data.leads.meta_leads}    sub={`FB: ${data.leads.facebook_leads} · IG: ${data.leads.instagram_leads}`} icon={<Target className="h-4 w-4" />} tone="indigo" />
            <StatCard label="Google Leads"   value={data.leads.google_leads}  sub={`Converted: ${data.leads.converted}`} icon={<Target className="h-4 w-4" />} tone="emerald" />
          </section>

          {/* Source breakdown + Daily chart */}
          <section className="grid gap-4 lg:grid-cols-2">
            {/* By source */}
            <div className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Leads by Source (All Time)
              </p>
              {data.by_source.length === 0 ? (
                <p className={`mt-4 text-sm ${adminMutedCls}`}>No leads yet.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {data.by_source.map((s) => {
                    const maxVal = Math.max(1, ...data.by_source.map((x) => x.total));
                    const w = Math.round((s.total / maxVal) * 100);
                    const convRate = s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0;
                    return (
                      <li key={s.source}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 font-medium">
                            <span className={`inline-block h-2 w-2 rounded-full ${SOURCE_COLORS[s.source] ?? "bg-slate-400"}`} />
                            {SOURCE_LABELS[s.source] ?? s.source}
                          </span>
                          <span className="flex items-center gap-3 tabular-nums">
                            <span className={adminMutedCls}>This month: {s.month}</span>
                            <span className="text-emerald-600 dark:text-emerald-300">{convRate}% conv</span>
                            <span className="font-bold">{s.total}</span>
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${SOURCE_COLORS[s.source] ?? "bg-slate-400"}`}
                            style={{ width: `${w}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Daily leads sparkline */}
            <div className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Daily Leads · Last 30 Days
              </p>
              <DailyChart points={data.daily_leads} />
              <div className="mt-3 flex gap-4 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-full bg-blue-400" />Meta</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-full bg-emerald-400" />Google</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-full bg-slate-300" />Other</span>
              </div>
            </div>
          </section>

          {/* Email campaigns */}
          <section className="grid gap-4 lg:grid-cols-2">
            {/* Email stats */}
            <div className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Email Campaigns
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Sent Today",    val: data.email.sent_today,  tone: "emerald" },
                  { label: "Sent Month",    val: data.email.sent_month,  tone: "emerald" },
                  { label: "Queued",        val: data.email.queued,      tone: "amber" },
                  { label: "Failed",        val: data.email.failed,      tone: data.email.failed > 0 ? "rose" : undefined },
                  { label: "Total Sent",    val: data.email.sent },
                  { label: "Dry Run",       val: data.email.dry_run },
                ].map((s) => (
                  <div key={s.label}>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{s.label}</dt>
                    <dd className={`mt-0.5 text-lg font-bold tabular-nums ${
                      s.tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" :
                      s.tone === "rose"    ? "text-rose-600 dark:text-rose-300" :
                      s.tone === "amber"   ? "text-amber-600 dark:text-amber-300" :
                      "text-slate-700 dark:text-slate-200"
                    }`}>{s.val.toLocaleString("en-IN")}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Email by template */}
            <div className={`${adminCardCls} overflow-hidden`}>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Email Templates Performance
                </p>
              </div>
              {data.email_by_template.length === 0 ? (
                <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No emails sent yet.</p>
              ) : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      {["Template", "Total", "Sent", "Failed", "Rate"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.email_by_template.map((t) => {
                      const rate = t.total > 0 ? Math.round((t.sent / t.total) * 100) : 0;
                      return (
                        <tr key={t.template} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 font-medium">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] dark:bg-slate-800">{t.template}</span>
                          </td>
                          <td className="px-4 py-2.5 tabular-nums text-xs">{t.total.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 tabular-nums text-xs text-emerald-600 dark:text-emerald-300">{t.sent.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 tabular-nums text-xs text-rose-600 dark:text-rose-300">{t.failed.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              rate >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" :
                              rate >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" :
                              "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                            }`}>{rate}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
              )}
            </div>
          </section>

          {/* Conversion funnel */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Lead Funnel
            </p>
            <div className="mt-4 flex items-end gap-2">
              {[
                { label: "Total Leads",   val: data.leads.total_leads,  color: "bg-slate-300 dark:bg-slate-700" },
                { label: "New",           val: data.leads.new_leads,    color: "bg-sky-400" },
                { label: "Meta",          val: data.leads.meta_leads,   color: "bg-blue-500" },
                { label: "Google",        val: data.leads.google_leads, color: "bg-emerald-500" },
                { label: "Converted",     val: data.leads.converted,    color: "bg-indigo-600" },
              ].map((f) => {
                const maxVal = Math.max(1, data.leads.total_leads);
                const h = Math.max(8, Math.round((f.val / maxVal) * 100));
                return (
                  <div key={f.label} className="flex flex-1 flex-col items-center gap-1">
                    <p className="text-xs font-bold tabular-nums">{f.val.toLocaleString("en-IN")}</p>
                    <div className={`w-full rounded-t ${f.color}`} style={{ height: `${h}px` }} />
                    <p className={`text-center text-[10px] ${adminMutedCls}`}>{f.label}</p>
                  </div>
                );
              })}
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
    <div className="mt-4 flex h-20 items-end gap-0.5">
      {points.map((p, i) => {
        const h = Math.max(2, Math.round((p.total / max) * 100));
        const metaPct = p.total > 0 ? Math.round((p.meta / p.total) * 100) : 0;
        const googlePct = p.total > 0 ? Math.round((p.google / p.total) * 100) : 0;
        return (
          <div
            key={i}
            title={`${p.d}: ${p.total} leads (Meta: ${p.meta}, Google: ${p.google})`}
            className="group flex-1 rounded-t bg-slate-200 transition hover:bg-indigo-400 dark:bg-slate-700 dark:hover:bg-indigo-500"
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, icon, tone }: {
  label: string; value: number; sub?: string; icon?: React.ReactNode;
  tone?: "emerald" | "rose" | "indigo";
}) {
  const accent =
    tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" :
    tone === "rose"    ? "text-rose-600 dark:text-rose-300" :
    tone === "indigo"  ? "text-indigo-600 dark:text-indigo-300" :
                         "text-slate-700 dark:text-slate-200";
  return (
    <div className={`${adminCardCls} p-4`}>
      <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>{icon}{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${accent}`}>{value.toLocaleString("en-IN")}</p>
      {sub && <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{sub}</p>}
    </div>
  );
}

function Loading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>;
}
function Denied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-base font-bold">Access denied</h1>
        <p className="mt-1 text-xs text-slate-500">marketing.view permission required.</p>
      </div>
    </main>
  );
}


