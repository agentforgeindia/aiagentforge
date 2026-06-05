"use client";

// /admin/team/attendance â€” Full attendance dashboard for founder.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Users, Clock, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../../AdminShell";
import { useAdminPermissions } from "../../AdminPermissions";

type TodayLog = {
  id: string;
  member_email: string;
  member_name: string | null;
  check_in: string;
  check_out: string | null;
  duration_mins: number | null;
  work_notes: string | null;
};

type OnlineNow = {
  member_email: string;
  member_name: string | null;
  check_in: string;
};

type MonthlySummary = {
  member_email: string;
  member_name: string | null;
  days_present: number;
  total_mins: number;
  avg_mins_per_day: number;
};

type Overview = {
  date: string;
  today: TodayLog[];
  online_now: OnlineNow[];
  monthly: MonthlySummary[];
};

function formatMins(mins: number): string {
  if (!mins) return "â€”";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function timeSince(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AttendancePage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("team.view") || has("attendance.view");

  const [data, setData]       = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [refreshKey, setRefreshKey] = useState(0);
  const [tick, setTick] = useState(0);

  // Live tick every 30s to update "online since" times
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("attendance_overview", { p_date: selectedDate });
      setData(m as Overview);
      setLoading(false);
    })();
  }, [canView, selectedDate, refreshKey]);

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const totalOnline   = data?.online_now.length ?? 0;
  const totalToday    = data?.today.length ?? 0;
  const avgHoursToday = data?.today.length
    ? Math.round(data.today.reduce((s, l) => s + (l.duration_mins ?? 0), 0) / data.today.length)
    : 0;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Team", href: "/admin/team" }, { label: "Attendance" }]}
      title="Attendance"
      subtitle="Team check-ins, session time, and work logs"
      email={email}
      actions={
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
          />
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loadingâ€¦</p>
      ) : !data ? (
        <p className="p-6 text-center text-sm text-rose-600">No data</p>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <section className="grid gap-3 sm:grid-cols-3">
            <div className={`${adminCardCls} p-4`}>
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>
                <Users className="h-3.5 w-3.5" />Online Now
              </p>
              <p className={`mt-1 text-3xl font-bold tabular-nums ${totalOnline > 0 ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400"}`}>
                {totalOnline}
              </p>
              {data.online_now.length > 0 && (
                <p className={`mt-0.5 text-xs ${adminMutedCls}`}>
                  {data.online_now.map((o) => o.member_name ?? o.member_email.split("@")[0]).join(", ")}
                </p>
              )}
            </div>
            <div className={`${adminCardCls} p-4`}>
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>
                <CheckCircle className="h-3.5 w-3.5" />Check-ins Today
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{totalToday}</p>
            </div>
            <div className={`${adminCardCls} p-4`}>
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>
                <Clock className="h-3.5 w-3.5" />Avg Session
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{formatMins(avgHoursToday)}</p>
            </div>
          </section>

          {/* Currently Online */}
          {data.online_now.length > 0 && (
            <section className={`${adminCardCls} overflow-hidden`}>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  Currently Online
                </p>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.online_now.map((o) => (
                  <li key={o.member_email} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        {(o.member_name ?? o.member_email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{o.member_name ?? o.member_email.split("@")[0]}</p>
                        <p className={`text-[11px] ${adminMutedCls}`}>{o.member_email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
                        {timeSince(o.check_in)} online
                      </p>
                      <p className={`text-[11px] ${adminMutedCls}`}>Since {formatTime(o.check_in)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Today's Logs */}
          <section className={`${adminCardCls} overflow-hidden`}>
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Logs â€” {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            {data.today.length === 0 ? (
              <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No check-ins for this date.</p>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Member", "Check In", "Check Out", "Duration", "Work Notes"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.today.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${log.check_out ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"}`}>
                            {(log.member_name ?? log.member_email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{log.member_name ?? log.member_email.split("@")[0]}</p>
                            <p className={`text-[10px] ${adminMutedCls}`}>{log.member_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-xs">{formatTime(log.check_in)}</td>
                      <td className="px-4 py-3 tabular-nums text-xs">
                        {log.check_out ? formatTime(log.check_out) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Online
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">
                        {log.duration_mins ? formatMins(log.duration_mins) : (
                          log.check_out ? "â€”" : (
                            <span className="text-emerald-600 dark:text-emerald-300">
                              {timeSince(log.check_in)}
                            </span>
                          )
                        )}
                      </td>
                      <td className={`max-w-xs px-4 py-3 text-xs ${adminMutedCls}`}>
                        {log.work_notes ?? "â€”"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </section>

          {/* Monthly Summary */}
          <section className={`${adminCardCls} overflow-hidden`}>
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                Monthly Summary â€” {new Date(selectedDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>
            </div>
            {data.monthly.length === 0 ? (
              <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No data this month.</p>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Member", "Days Present", "Total Hours", "Avg / Day"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.monthly.map((m) => (
                    <tr key={m.member_email} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold">{m.member_name ?? m.member_email.split("@")[0]}</p>
                        <p className={`text-[10px] ${adminMutedCls}`}>{m.member_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                          {m.days_present} days
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">{formatMins(m.total_mins)}</td>
                      <td className={`px-4 py-3 text-xs ${adminMutedCls}`}>{formatMins(m.avg_mins_per_day)}</td>
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

function Loading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking accessâ€¦</main>;
}
function Denied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-base font-bold">Access denied</h1>
        <p className="mt-1 text-xs text-slate-500">team.view permission required.</p>
      </div>
    </main>
  );
}


