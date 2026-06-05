"use client";

// /admin/refunds-center — Refund & Dispute Center.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Plus, X, Check, Ban } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Req = {
  id: string; customer_email: string | null; customer_name: string | null;
  payment_id: string | null; amount_inr: number; reason: string; type: string;
  status: string; requested_by: string | null; approved_by: string | null;
  resolution: string | null; created_at: string;
};

const TYPES = [
  { value: "refund",     label: "Refund" },
  { value: "dispute",    label: "Dispute" },
  { value: "chargeback", label: "Chargeback" },
];

export default function RefundsCenterPage() {
  const { loading: pLoading, has, isAdmin, email } = useAdminPermissions();
  const canView   = has("invoices.refund") || has("support.view") || isAdmin;
  const canManage = has("invoices.refund") || has("support.manage") || isAdmin;

  const [reqs, setReqs]       = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("open");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNew, setShowNew] = useState(false);

  // form
  const [fEmail, setFEmail] = useState("");
  const [fName, setFName]   = useState("");
  const [fPay, setFPay]     = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fType, setFType]   = useState("refund");
  const [fReason, setFReason] = useState("");
  const [fSaving, setFSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("refund_requests").select("*").order("created_at", { ascending: false });
      setReqs((data as Req[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function raise(e: React.FormEvent) {
    e.preventDefault();
    if (!fReason) return;
    setFSaving(true);
    await supabase.from("refund_requests").insert({
      customer_email: fEmail || null, customer_name: fName || null,
      payment_id: fPay || null, amount_inr: parseFloat(fAmount) || 0,
      type: fType, reason: fReason, requested_by: email ?? "unknown",
    });
    setFEmail(""); setFName(""); setFPay(""); setFAmount(""); setFType("refund"); setFReason("");
    setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  async function decide(id: string, status: "approved" | "rejected" | "processed") {
    const note = status === "rejected" ? (prompt("Rejection reason:") ?? "") : "";
    await supabase.from("refund_requests").update({
      status, approved_by: email ?? "admin",
      resolution: note || null,
      resolved_at: new Date().toISOString(),
    }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const filtered = reqs.filter((r) => filter === "all" ? true : r.status === filter);
  const openCount = reqs.filter((r) => r.status === "open").length;
  const openAmount = reqs.filter((r) => r.status === "open").reduce((s, r) => s + r.amount_inr, 0);

  return (
    <AdminShell
      breadcrumbs={[{ label: "Refunds & Disputes" }]}
      title="Refund & Dispute Center"
      subtitle="Track refund requests, disputes and chargebacks"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}><Plus className="h-3.5 w-3.5" />New Request</button>}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {/* Stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className={`${adminCardCls} p-4`}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Open Requests</p>
          <p className={`mt-1 text-2xl font-bold ${openCount > 0 ? "text-amber-600 dark:text-amber-300" : ""}`}>{openCount}</p>
        </div>
        <div className={`${adminCardCls} p-4`}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Open Amount</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-300">₹{openAmount.toLocaleString("en-IN")}</p>
        </div>
        <div className={`${adminCardCls} p-4`}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Total Requests</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{reqs.length}</p>
        </div>
      </div>

      {/* New form */}
      {showNew && canManage && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">New Refund / Dispute</p>
            <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <form onSubmit={raise} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input className={adminInputCls} placeholder="Customer email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
            <input className={adminInputCls} placeholder="Customer name" value={fName} onChange={(e) => setFName(e.target.value)} />
            <input className={adminInputCls} placeholder="Payment ID (optional)" value={fPay} onChange={(e) => setFPay(e.target.value)} />
            <input className={adminInputCls} placeholder="Amount ₹" type="number" value={fAmount} onChange={(e) => setFAmount(e.target.value)} />
            <select className={adminInputCls} value={fType} onChange={(e) => setFType(e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input className={adminInputCls} placeholder="Reason *" value={fReason} onChange={(e) => setFReason(e.target.value)} required />
            <button type="submit" disabled={fSaving} className={`${adminPrimaryBtnCls} lg:col-span-3 justify-center`}>{fSaving ? "Saving…" : "Create Request"}</button>
          </form>
        </section>
      )}

      {/* Filter */}
      <div className="mb-4 flex gap-1.5">
        {["open", "approved", "processed", "rejected", "all"].map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition ${filter === f ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} p-10 text-center`}><p className={`text-sm ${adminMutedCls}`}>No {filter} requests.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className={`${adminCardCls} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold capitalize text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">{r.type}</span>
                    <p className="text-sm font-bold">{r.customer_name ?? r.customer_email ?? "Customer"}</p>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-300">₹{r.amount_inr.toLocaleString("en-IN")}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === "approved" || r.status === "processed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" :
                      r.status === "rejected" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}>{r.status}</span>
                  </div>
                  <p className={`mt-1 text-xs ${adminMutedCls}`}>{r.reason}</p>
                  <p className={`mt-1 text-[11px] ${adminMutedCls}`}>
                    {r.payment_id && `Payment: ${r.payment_id} · `}
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {r.approved_by && ` · ${r.status} by ${r.approved_by.split("@")[0]}`}
                  </p>
                </div>
                {canManage && r.status === "open" && (
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <button type="button" onClick={() => decide(r.id, "approved")} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"><Check className="h-3.5 w-3.5" />Approve</button>
                    <button type="button" onClick={() => decide(r.id, "rejected")} className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-300"><Ban className="h-3.5 w-3.5" />Reject</button>
                  </div>
                )}
                {canManage && r.status === "approved" && (
                  <button type="button" onClick={() => decide(r.id, "processed")} className={`${adminPrimaryBtnCls} shrink-0`}>Mark Processed</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
