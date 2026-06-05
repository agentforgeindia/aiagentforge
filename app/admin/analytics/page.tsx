"use client";

// /admin/analytics â€” Meta Ads + GA4 + Clarity in one place + quick links.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, ExternalLink, BarChart3, Eye, MousePointerClick } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Prov = { configured: boolean; data?: any; note?: string };
type Data = { meta: Prov; ga4: Prov; clarity: Prov };

const DASHBOARDS = [
  { label: "Google Analytics", href: "https://analytics.google.com", color: "from-amber-400 to-orange-500" },
  { label: "Meta Ads Manager", href: "https://business.facebook.com/adsmanager", color: "from-blue-400 to-indigo-600" },
  { label: "Microsoft Clarity", href: "https://clarity.microsoft.com", color: "from-sky-400 to-cyan-600" },
];

export default function AnalyticsPage() {
  const { loading: pLoading, isAdmin, email } = useAdminPermissions();
  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const res = await fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${sess.session?.access_token}` } });
        const json = await res.json();
        setData(json.ok ? json : null);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, refreshKey]);

  if (pLoading) return <Loading />;
  if (!isAdmin)  return <Denied />;

  return (
    <AdminShell
      doodleType="analytics"
      breadcrumbs={[{ label: "Analytics" }]}
      title="Analytics"
      subtitle="Meta Ads, Google Analytics & Microsoft Clarity â€” last 7 days"
      email={email}
      actions={<button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" />Refresh</button>}
    >
      <div className="space-y-4">
        {/* Quick launch */}
        <section className="grid gap-3 sm:grid-cols-3">
          {DASHBOARDS.map((d) => (
            <a key={d.label} href={d.href} target="_blank" rel="noopener noreferrer"
              className={`flex items-center justify-between rounded-xl bg-gradient-to-r ${d.color} p-4 text-white shadow-md transition hover:scale-[1.02]`}>
              <span className="text-sm font-black">{d.label}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          ))}
        </section>

        {loading ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loadingâ€¦</p>
        ) : !data ? (
          <p className="p-6 text-center text-sm text-rose-600">Could not load analytics.</p>
        ) : (
          <>
            {/* Meta Ads */}
            <Block title="ðŸ“¢ Meta Ads Â· Last 7 Days" prov={data.meta}>
              {data.meta.data && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <Stat label="Spend"       value={`₹${Number(data.meta.data.spend).toLocaleString("en-IN")}`} />
                  <Stat label="Impressions" value={Number(data.meta.data.impressions).toLocaleString("en-IN")} />
                  <Stat label="Clicks"      value={Number(data.meta.data.clicks).toLocaleString("en-IN")} />
                  <Stat label="CTR"         value={`${Number(data.meta.data.ctr).toFixed(2)}%`} />
                  <Stat label="CPC"         value={`₹${Number(data.meta.data.cpc).toFixed(2)}`} />
                  <Stat label="Reach"       value={Number(data.meta.data.reach).toLocaleString("en-IN")} />
                </div>
              )}
            </Block>

            {/* GA4 */}
            <Block title="ðŸ“Š Google Analytics Â· Last 7 Days" prov={data.ga4}>
              {data.ga4.data && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Active Users" value={Number(data.ga4.data.active_users).toLocaleString("en-IN")} />
                    <Stat label="New Users"    value={Number(data.ga4.data.new_users).toLocaleString("en-IN")} />
                    <Stat label="Sessions"     value={Number(data.ga4.data.sessions).toLocaleString("en-IN")} />
                    <Stat label="Pageviews"    value={Number(data.ga4.data.pageviews).toLocaleString("en-IN")} />
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <List title="Top Pages" rows={(data.ga4.data.top_pages ?? []).map((p: any) => ({ label: p.path, value: p.views }))} />
                    <List title="Traffic Sources" rows={(data.ga4.data.sources ?? []).map((s: any) => ({ label: s.channel, value: s.sessions }))} />
                  </div>
                </>
              )}
            </Block>

            {/* Clarity */}
            <Block title="ðŸ” Microsoft Clarity Â· Last 3 Days" prov={data.clarity}>
              {data.clarity.data && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Sessions"    value={Number(data.clarity.data.sessions).toLocaleString("en-IN")} icon={<Eye className="h-4 w-4" />} />
                  <Stat label="Dead Clicks" value={Number(data.clarity.data.dead_clicks).toLocaleString("en-IN")} />
                  <Stat label="Rage Clicks" value={Number(data.clarity.data.rage_clicks).toLocaleString("en-IN")} icon={<MousePointerClick className="h-4 w-4" />} />
                </div>
              )}
            </Block>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function Block({ title, prov, children }: { title: string; prov: Prov; children: React.ReactNode }) {
  return (
    <section className={`${adminCardCls} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
        {!prov.configured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Not configured</span>}
      </div>
      {!prov.configured || prov.note ? (
        <p className={`text-xs ${adminMutedCls}`}>âš™ï¸ {prov.note ?? "No data."}</p>
      ) : children}
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/40">
      <p className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] ${adminMutedCls}`}>{icon}{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function List({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>{title}</p>
      {rows.length === 0 ? <p className={`text-xs ${adminMutedCls}`}>No data.</p> : (
        <ul className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={i}>
              <div className="flex justify-between text-xs"><span className="truncate font-medium">{r.label}</span><span className="ml-2 shrink-0 font-bold tabular-nums">{r.value.toLocaleString("en-IN")}</span></div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.round((r.value/max)*100)}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking accessâ€¦</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}

