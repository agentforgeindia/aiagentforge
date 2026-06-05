"use client";

// /admin/recruitment — Hiring OS dashboard (funnel + analytics).

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ShieldCheck, Users, Trophy, GraduationCap, FileQuestion } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Funnel = Record<string, number>;
type Lead = { name: string; role: string | null; final: number | null; stage: string };
type Data = {
  funnel: Funnel;
  by_role: { role: string; count: number }[];
  leaderboard: Lead[];
  rates: { selection_rate: number; joining_rate: number };
};

const FUNNEL_STEPS = [
  ["applied", "Applications"],
  ["training_started", "Training Started"],
  ["training_completed", "Training Completed"],
  ["passed", "Passed"],
  ["interview_eligible", "Interview Eligible"],
  ["selected", "Selected"],
  ["offers_sent", "Offers Sent"],
  ["offers_accepted", "Offers Accepted"],
  ["hired", "Hired"],
] as const;

export default function RecruitmentPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("hr.view");

  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("recruitment_overview");
      setData(m as Data);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const maxF = data ? Math.max(1, ...FUNNEL_STEPS.map(([k]) => data.funnel[k] ?? 0)) : 1;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Recruitment" }]}
      title="Hiring OS"
      subtitle="No-resume hiring — funnel, analytics, candidate pipeline"
      email={email}
      actions={
        <div className="flex gap-2">
          <Link href="/admin/recruitment/candidates" className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-indigo-600"><Users className="h-3.5 w-3.5" />Candidates</Link>
          <Link href="/admin/recruitment/questions" className={adminSecondaryBtnCls}><FileQuestion className="h-3.5 w-3.5" />Questions</Link>
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : !data ? (
        <p className="p-6 text-center text-sm text-rose-600">No data</p>
      ) : (
        <div className="space-y-4">
          {/* Rate cards */}
          <section className="grid gap-3 sm:grid-cols-4">
            <Stat label="Total Applications" value={data.funnel.applied ?? 0} icon={<Users className="h-4 w-4" />} />
            <Stat label="Hired"             value={data.funnel.hired ?? 0}    icon={<GraduationCap className="h-4 w-4" />} tone="emerald" />
            <Stat label="Selection Rate"    value={`${data.rates.selection_rate}%`} />
            <Stat label="Joining Rate"      value={`${data.rates.joining_rate}%`} tone="emerald" />
          </section>

          {/* Funnel */}
          <section className={`${adminCardCls} p-4`}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Hiring Funnel</p>
            <div className="space-y-2">
              {FUNNEL_STEPS.map(([k, label]) => {
                const v = data.funnel[k] ?? 0;
                const w = Math.round((v / maxF) * 100);
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{label}</span>
                      <span className="tabular-nums font-bold">{v}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {/* By role */}
            <div className={`${adminCardCls} p-4`}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Applications by Role</p>
              {data.by_role.length === 0 ? <p className={`text-sm ${adminMutedCls}`}>No applications yet.</p> : (
                <ul className="space-y-2">
                  {data.by_role.map((r) => {
                    const max = Math.max(1, ...data.by_role.map((x) => x.count));
                    return (
                      <li key={r.role}>
                        <div className="flex justify-between text-xs"><span className="font-medium capitalize">{r.role?.replace("-", " ") ?? "—"}</span><span className="font-bold">{r.count}</span></div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.round((r.count/max)*100)}%` }} /></div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Leaderboard */}
            <div className={`${adminCardCls} overflow-hidden`}>
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <Trophy className="h-4 w-4 text-amber-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Top Candidates</p>
              </div>
              {data.leaderboard.length === 0 ? <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No scored candidates yet.</p> : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.leaderboard.map((c, i) => (
                    <li key={i} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</span>
                        <div>
                          <p className="text-xs font-bold">{c.name}</p>
                          <p className={`text-[10px] capitalize ${adminMutedCls}`}>{c.role?.replace("-", " ") ?? "—"}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-300">{c.final}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string | number; icon?: React.ReactNode; tone?: "emerald" }) {
  const c = tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200";
  return (
    <div className={`${adminCardCls} p-4`}>
      <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>{icon}{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${c}`}>{value}</p>
    </div>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
        <p className="mt-1 text-xs text-slate-500">hr.view permission required.</p>
      </div>
    </main>
  );
}
