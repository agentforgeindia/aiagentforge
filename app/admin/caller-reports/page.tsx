"use client";

// /admin/caller-reports â€” Daily caller reporting + supervisor view.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Save, Phone, Flame, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls, adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Row = {
  caller_email: string; caller_name: string | null;
  total_calls: number; connected: number; demos_sent: number;
  interested: number; hot_leads: number; paid: number; remarks: string | null;
};
type Summary = {
  date: string;
  totals: { callers: number; total_calls: number; connected: number; demos_sent: number; interested: number; hot_leads: number; paid: number };
  rows: Row[];
};

const FIELDS: { key: string; label: string }[] = [
  { key: "total_calls", label: "Total Calls" },
  { key: "connected", label: "Connected" },
  { key: "demos_sent", label: "Demos Sent" },
  { key: "pricing_sent", label: "Pricing Sent" },
  { key: "interested", label: "Interested" },
  { key: "hot_leads", label: "Hot Leads" },
  { key: "callbacks", label: "Callbacks" },
  { key: "not_interested", label: "Not Interested" },
  { key: "wrong_numbers", label: "Wrong Numbers" },
  { key: "paid_conversions", label: "Paid" },
];

export default function CallerReportsPage() {
  const { loading: pLoading, has, isAdmin, email } = useAdminPermissions();
  const isSupervisor = has("team.view") || isAdmin;

  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // My report form
  const [form, setForm] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  // Load my today's report
  useEffect(() => {
    if (!email) return;
    (async () => {
      const { data } = await supabase.from("caller_reports").select("*").eq("caller_email", email).eq("report_date", date).maybeSingle();
      if (data) {
        const f: Record<string, number> = {};
        for (const { key } of FIELDS) f[key] = (data as any)[key] ?? 0;
        setForm(f); setRemarks(data.remarks ?? "");
      } else { setForm({}); setRemarks(""); }
    })();
  }, [email, date, refreshKey]);

  const [funnel, setFunnel] = useState<any | null>(null);

  // Load supervisor summary
  useEffect(() => {
    if (!isSupervisor) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      const [{ data: s }, { data: f }] = await Promise.all([
        supabase.rpc("caller_report_summary", { p_date: date }),
        supabase.rpc("caller_funnel", { p_days: 7 }),
      ]);
      setSummary(s as Summary);
      setFunnel(f);
      setLoading(false);
    })();
  }, [isSupervisor, date, refreshKey]);

  async function saveReport() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      caller_email: email, caller_name: email?.split("@")[0],
      report_date: date, remarks: remarks || null,
    };
    for (const { key } of FIELDS) payload[key] = form[key] || 0;
    await supabase.from("caller_reports").upsert(payload, { onConflict: "caller_email,report_date" });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Caller Reports" }]}
      title="Daily Caller Reports"
      subtitle="Log your daily numbers Â· supervisors see team totals"
      email={email}
      actions={
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900" />
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* My report form */}
        <section className={`${adminCardCls} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">My Report â€” {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
            {saved && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">Saved!</span>}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className={`text-[10px] font-bold uppercase tracking-[0.14em] ${adminMutedCls}`}>{f.label}</label>
                <input type="number" className={`${adminInputCls} mt-1`} value={form[f.key] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))} />
              </div>
            ))}
          </div>
          <textarea className={`${adminInputCls} mt-3`} rows={2} placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <button type="button" onClick={saveReport} disabled={saving} className={`${adminPrimaryBtnCls} mt-3`}>
            <Save className="h-3.5 w-3.5" />{saving ? "Savingâ€¦" : "Save My Report"}
          </button>
        </section>

        {/* Supervisor view */}
        {isSupervisor && (
          <>
            {loading ? (
              <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading teamâ€¦</p>
            ) : summary && (
              <>
                {/* 7-day conversion funnel */}
                {funnel && (
                  <section className={`${adminCardCls} p-4`}>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Conversion Funnel Â· Last 7 Days</p>
                    <div className="flex items-end gap-2">
                      {[
                        { label: "Calls",      val: funnel.calls,      color: "bg-slate-400" },
                        { label: "Connected",  val: funnel.connected,  color: "bg-sky-400" },
                        { label: "Demos",      val: funnel.demos,      color: "bg-blue-500" },
                        { label: "Interested", val: funnel.interested, color: "bg-indigo-500" },
                        { label: "Hot Leads",  val: funnel.hot,        color: "bg-amber-500" },
                        { label: "Paid",       val: funnel.paid,       color: "bg-emerald-500" },
                      ].map((s) => {
                        const max = Math.max(1, funnel.calls);
                        const h = Math.max(10, Math.round((s.val / max) * 120));
                        return (
                          <div key={s.label} className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-xs font-bold tabular-nums">{Number(s.val).toLocaleString("en-IN")}</span>
                            <div className={`w-full rounded-t ${s.color}`} style={{ height: `${h}px` }} />
                            <span className={`text-center text-[10px] ${adminMutedCls}`}>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    {funnel.calls > 0 && (
                      <p className={`mt-3 text-[11px] ${adminMutedCls}`}>
                        Conversion: {funnel.calls} calls â†’ {funnel.demos} demos ({Math.round((funnel.demos / funnel.calls) * 100)}%) â†’ {funnel.paid} paid ({funnel.demos > 0 ? Math.round((funnel.paid / funnel.demos) * 100) : 0}% of demos)
                      </p>
                    )}
                  </section>
                )}

                {/* Team totals */}
                <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <Stat label="Callers"     value={summary.totals.callers} />
                  <Stat label="Total Calls" value={summary.totals.total_calls} icon={<Phone className="h-4 w-4" />} />
                  <Stat label="Connected"   value={summary.totals.connected} />
                  <Stat label="Demos"       value={summary.totals.demos_sent} />
                  <Stat label="Hot Leads"   value={summary.totals.hot_leads} tone="rose" icon={<Flame className="h-4 w-4" />} />
                  <Stat label="Paid"        value={summary.totals.paid} tone="emerald" icon={<CheckCircle className="h-4 w-4" />} />
                </section>

                {/* Per-caller table */}
                <section className={`${adminCardCls} overflow-hidden`}>
                  <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Team Reports</p>
                  </div>
                  {summary.rows.length === 0 ? (
                    <p className={`p-6 text-center text-sm ${adminMutedCls}`}>No reports submitted for this date.</p>
                  ) : (
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          {["Caller", "Calls", "Connected", "Demos", "Interested", "Hot", "Paid", "Remarks"].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {summary.rows.map((r) => (
                          <tr key={r.caller_email} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-2.5 text-xs font-bold">{r.caller_name ?? r.caller_email.split("@")[0]}</td>
                            <td className="px-4 py-2.5 tabular-nums text-xs">{r.total_calls}</td>
                            <td className="px-4 py-2.5 tabular-nums text-xs">{r.connected}</td>
                            <td className="px-4 py-2.5 tabular-nums text-xs">{r.demos_sent}</td>
                            <td className="px-4 py-2.5 tabular-nums text-xs">{r.interested}</td>
                            <td className="px-4 py-2.5 tabular-nums text-xs font-bold text-rose-600 dark:text-rose-300">{r.hot_leads}</td>
                            <td className="px-4 py-2.5 tabular-nums text-xs font-bold text-emerald-600 dark:text-emerald-300">{r.paid}</td>
                            <td className={`max-w-xs px-4 py-2.5 text-[11px] ${adminMutedCls}`}>{r.remarks ?? "â€”"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: number; icon?: React.ReactNode; tone?: "rose" | "emerald" }) {
  const c = tone === "rose" ? "text-rose-600 dark:text-rose-300" : tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200";
  return (
    <div className={`${adminCardCls} p-3`}>
      <p className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] ${adminMutedCls}`}>{icon}{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums ${c}`}>{value.toLocaleString("en-IN")}</p>
    </div>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking accessâ€¦</main>; }


