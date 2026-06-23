"use client";

// /admin/workshop-survey — what day/time visitors want the next workshop.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, RefreshCw, ShieldCheck } from "lucide-react";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Tally = { label: string; count: number };
type Resp = { id: string; preferred_day: string | null; preferred_time: string | null; name: string | null; phone: string | null; created_at: string };

export default function WorkshopSurveyPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } = useAdminPermissions();
  const canView = has("customers.view") || isAdmin;

  const [days, setDays] = useState<Tally[]>([]);
  const [times, setTimes] = useState<Tally[]>([]);
  const [responses, setResponses] = useState<Resp[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const token = useMemo(() => async () => (await supabase.auth.getSession()).data.session?.access_token ?? "", []);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const res = await fetch("/api/admin/workshop-survey", { headers: { Authorization: `Bearer ${await token()}` } });
      const j = await res.json();
      if (j.ok) { setDays(j.days || []); setTimes(j.times || []); setResponses(j.responses || []); setTotal(j.total || 0); }
      setLoading(false);
    })();
  }, [canView, refreshKey, token]);

  const Bars = ({ title, data }: { title: string; data: Tally[] }) => {
    const max = Math.max(1, ...data.map((d) => d.count));
    return (
      <div className={`${adminCardCls} p-4`}>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <div className="mt-3 space-y-2">
          {data.length === 0 ? (
            <p className={`text-sm ${adminMutedCls}`}>No data yet.</p>
          ) : data.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-xs font-bold">{d.label}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-white/10">
                <div className="h-full rounded bg-gradient-to-r from-cyan-500 to-violet-600" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-black">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loadingAuth) return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500">Checking access...</main>;
  if (!authEmail || !isAdmin || !canView)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
        </div>
      </main>
    );

  return (
    <AdminShell
      doodleType="analytics"
      breadcrumbs={[{ label: "Workshop Survey" }]}
      title="Workshop Survey"
      subtitle={`What day & time people want — ${total} response${total === 1 ? "" : "s"}`}
      email={authEmail}
      actions={<button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" />Refresh</button>}
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bars title="Preferred Day" data={days} />
            <Bars title="Preferred Time" data={times} />
          </div>

          <div className={`${adminCardCls} mt-4`}>
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Responses</p>
            </div>
            {responses.length === 0 ? (
              <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No responses yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {responses.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">
                        {r.preferred_day} · {r.preferred_time}
                      </p>
                      <p className={`text-[11px] ${adminMutedCls}`}>
                        {r.name || "—"}{r.phone ? ` · ${r.phone}` : ""} · {new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </AdminShell>
  );
}
