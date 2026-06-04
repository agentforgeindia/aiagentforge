"use client";

// /admin/support-center — Customer support tickets.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Ticket, AlertTriangle, CheckCircle, Clock, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls,
  adminMutedCls,
  adminSecondaryBtnCls,
  adminPrimaryBtnCls,
  adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type TicketRow = {
  id: string;
  ticket_number: number;
  user_email: string | null;
  user_name: string | null;
  category: string;
  subject: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type Counts = {
  total: number;
  open_count: number;
  in_progress_count: number;
  resolved_count: number;
  closed_count: number;
  urgent_count: number;
  opened_today: number;
  opened_week: number;
  billing_issues: number;
  generation_issues: number;
  refund_requests: number;
  account_issues: number;
  general_issues: number;
};

type Metrics = { counts: Counts; recent: TicketRow[]; error?: string };

const CATEGORIES = [
  { value: "billing",    label: "Billing Issue",      color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  { value: "generation", label: "Generation Issue",   color: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
  { value: "refund",     label: "Refund Request",     color: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300" },
  { value: "account",    label: "Account Issue",      color: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
  { value: "general",    label: "General",            color: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300" },
];

const PRIORITIES = [
  { value: "urgent", label: "Urgent", color: "text-rose-600 dark:text-rose-300" },
  { value: "high",   label: "High",   color: "text-amber-600 dark:text-amber-300" },
  { value: "normal", label: "Normal", color: "text-slate-600 dark:text-slate-300" },
  { value: "low",    label: "Low",    color: "text-slate-400 dark:text-slate-500" },
];

const STATUSES = [
  { value: "open",        label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved",    label: "Resolved" },
  { value: "closed",      label: "Closed" },
];

export default function SupportCenterPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("support.view");
  const canManage = has("support.manage");

  const [data, setData]         = useState<Metrics | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterStatus, setFilterStatus] = useState("open");
  const [showNew, setShowNew]   = useState(false);

  // New ticket form
  const [fEmail,    setFEmail]    = useState("");
  const [fName,     setFName]     = useState("");
  const [fCat,      setFCat]      = useState("general");
  const [fSubject,  setFSubject]  = useState("");
  const [fDesc,     setFDesc]     = useState("");
  const [fPriority, setFPriority] = useState("normal");
  const [fSaving,   setFSaving]   = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("support_metrics");
      setData(m as Metrics);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!fSubject) return;
    setFSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    await supabase.from("support_tickets").insert({
      user_email:  fEmail || null,
      user_name:   fName  || null,
      category:    fCat,
      subject:     fSubject,
      description: fDesc  || null,
      priority:    fPriority,
      status:      "open",
    });
    setFEmail(""); setFName(""); setFSubject(""); setFDesc("");
    setFCat("general"); setFPriority("normal");
    setShowNew(false);
    setRefreshKey((k) => k + 1);
    setFSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("support_tickets").update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
    }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const filtered = data?.recent.filter((t) =>
    filterStatus === "all" ? true : t.status === filterStatus
  ) ?? [];

  return (
    <AdminShell
      breadcrumbs={[{ label: "Support" }]}
      title="Support Center"
      subtitle="Customer tickets — billing, generation, refunds"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && (
            <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}>
              <Plus className="h-3.5 w-3.5" />
              New Ticket
            </button>
          )}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : !data || data.error ? (
        <p className="p-6 text-center text-sm text-rose-600">{data?.error ?? "No data"}</p>
      ) : (
        <div className="space-y-4">
          {/* New ticket form */}
          {showNew && canManage && (
            <section className={`${adminCardCls} p-4`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">New Ticket</p>
                <button type="button" onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={createTicket} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <input className={adminInputCls} placeholder="Customer email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
                <input className={adminInputCls} placeholder="Customer name" value={fName} onChange={(e) => setFName(e.target.value)} />
                <select className={adminInputCls} value={fCat} onChange={(e) => setFCat(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input className={`${adminInputCls} sm:col-span-2`} placeholder="Subject *" value={fSubject} onChange={(e) => setFSubject(e.target.value)} required />
                <select className={adminInputCls} value={fPriority} onChange={(e) => setFPriority(e.target.value)}>
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <textarea className={`${adminInputCls} lg:col-span-3`} placeholder="Description" rows={3} value={fDesc} onChange={(e) => setFDesc(e.target.value)} />
                <button type="submit" disabled={fSaving} className={`${adminPrimaryBtnCls} lg:col-span-3 justify-center`}>
                  {fSaving ? "Creating…" : "Create Ticket"}
                </button>
              </form>
            </section>
          )}

          {/* Stats */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Open Tickets"      value={data.counts.open_count}       tone={data.counts.open_count > 0 ? "rose" : undefined}   icon={<Ticket className="h-4 w-4" />} />
            <StatCard label="In Progress"        value={data.counts.in_progress_count} tone="amber" icon={<Clock className="h-4 w-4" />} />
            <StatCard label="Urgent"             value={data.counts.urgent_count}      tone={data.counts.urgent_count > 0 ? "rose" : undefined} icon={<AlertTriangle className="h-4 w-4" />} />
            <StatCard label="Resolved All Time"  value={data.counts.resolved_count}   tone="emerald" icon={<CheckCircle className="h-4 w-4" />} />
          </section>

          {/* Category breakdown */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">By Category</p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-5">
              {[
                { label: "Billing",    val: data.counts.billing_issues },
                { label: "Generation", val: data.counts.generation_issues },
                { label: "Refunds",    val: data.counts.refund_requests },
                { label: "Account",    val: data.counts.account_issues },
                { label: "General",    val: data.counts.general_issues },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{s.label}</dt>
                  <dd className="mt-0.5 text-xl font-bold tabular-nums">{s.val}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Ticket list */}
          <section className={`${adminCardCls} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Tickets {filtered.length > 0 && `· ${filtered.length}`}
              </p>
              <div className="flex gap-1">
                {["open", "in_progress", "all"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${filterStatus === s ? "bg-slate-900 text-white dark:bg-indigo-600" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    {s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No tickets.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["#", "Customer", "Category", "Subject", "Priority", "Status", "Date", ""].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((t) => {
                    const cat     = CATEGORIES.find((c) => c.value === t.category);
                    const pri     = PRIORITIES.find((p) => p.value === t.priority);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className={`px-3 py-2.5 text-xs ${adminMutedCls}`}>#{t.ticket_number}</td>
                        <td className="px-3 py-2.5">
                          <p className="text-xs font-medium">{t.user_name ?? "—"}</p>
                          <p className={`text-[11px] ${adminMutedCls}`}>{t.user_email ?? "—"}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cat?.color ?? ""}`}>
                            {cat?.label ?? t.category}
                          </span>
                        </td>
                        <td className="max-w-[200px] px-3 py-2.5 text-xs font-medium">{t.subject}</td>
                        <td className={`px-3 py-2.5 text-xs font-bold ${pri?.color ?? ""}`}>{pri?.label ?? t.priority}</td>
                        <td className="px-3 py-2.5">
                          {canManage ? (
                            <select
                              className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900"
                              value={t.status}
                              onChange={(e) => updateStatus(t.id, e.target.value)}
                            >
                              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          ) : (
                            <span className="text-xs">{t.status}</span>
                          )}
                        </td>
                        <td className={`px-3 py-2.5 text-[11px] ${adminMutedCls}`}>
                          {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-3 py-2.5" />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function StatCard({ label, value, icon, tone }: {
  label: string; value: number; icon?: React.ReactNode;
  tone?: "emerald" | "rose" | "amber";
}) {
  const accent =
    tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" :
    tone === "rose"    ? "text-rose-600 dark:text-rose-300" :
    tone === "amber"   ? "text-amber-600 dark:text-amber-300" :
                         "text-slate-700 dark:text-slate-200";
  return (
    <div className={`${adminCardCls} p-4`}>
      <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>{icon}{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${accent}`}>{value.toLocaleString("en-IN")}</p>
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
        <p className="mt-1 text-xs text-slate-500">support.view permission required.</p>
      </div>
    </main>
  );
}
