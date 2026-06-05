"use client";

// /admin/approvals — Internal Approval System.
// Team raises requests, managers/founder approve or reject.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Plus, X, Check, Ban } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Req = {
  id: string; type: string; title: string; amount_inr: number | null;
  details: string | null; requested_by: string; status: string;
  decided_by: string | null; decided_at: string | null; decision_note: string | null;
  created_at: string;
};

const TYPES = [
  { value: "discount",     label: "Discount" },
  { value: "refund",       label: "Refund" },
  { value: "expense",      label: "Expense" },
  { value: "credit_grant", label: "Credit Grant" },
  { value: "other",        label: "Other" },
];

export default function ApprovalsPage() {
  const { loading: pLoading, has, isAdmin, email } = useAdminPermissions();
  const canView   = has("approvals.view") || isAdmin;
  const canDecide = has("approvals.decide");

  const [reqs, setReqs]       = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("pending");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNew, setShowNew] = useState(false);

  // form
  const [fType, setFType]   = useState("discount");
  const [fTitle, setFTitle] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fDetails, setFDetails] = useState("");
  const [fSaving, setFSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("approval_requests").select("*").order("created_at", { ascending: false });
      setReqs((data as Req[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function raise(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle) return;
    setFSaving(true);
    await supabase.from("approval_requests").insert({
      type: fType, title: fTitle, amount_inr: fAmount ? parseFloat(fAmount) : null,
      details: fDetails || null, requested_by: email ?? "unknown",
    });
    setFType("discount"); setFTitle(""); setFAmount(""); setFDetails("");
    setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  async function decide(id: string, status: "approved" | "rejected") {
    const note = prompt(`${status === "approved" ? "Approve" : "Reject"} — add a note (optional):`) ?? "";
    await supabase.from("approval_requests").update({
      status, decided_by: email ?? "admin", decided_at: new Date().toISOString(), decision_note: note || null,
    }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const filtered = reqs.filter((r) => filter === "all" ? true : r.status === filter);
  const pendingCount = reqs.filter((r) => r.status === "pending").length;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Approvals" }]}
      title="Approvals"
      subtitle="Discount, refund, expense & credit requests — approve or reject"
      email={email}
      actions={
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}><Plus className="h-3.5 w-3.5" />New Request</button>
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {/* New form */}
      {showNew && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">New Approval Request</p>
            <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <form onSubmit={raise} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select className={adminInputCls} value={fType} onChange={(e) => setFType(e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input className={adminInputCls} placeholder="Title *" value={fTitle} onChange={(e) => setFTitle(e.target.value)} required />
            <input className={adminInputCls} placeholder="Amount ₹ (optional)" type="number" value={fAmount} onChange={(e) => setFAmount(e.target.value)} />
            <input className={adminInputCls} placeholder="Details" value={fDetails} onChange={(e) => setFDetails(e.target.value)} />
            <button type="submit" disabled={fSaving} className={`${adminPrimaryBtnCls} lg:col-span-4 justify-center`}>{fSaving ? "Submitting…" : "Submit Request"}</button>
          </form>
        </section>
      )}

      {/* Filter */}
      <div className="mb-4 flex gap-1.5">
        {[
          { k: "pending",  label: `Pending (${pendingCount})` },
          { k: "approved", label: "Approved" },
          { k: "rejected", label: "Rejected" },
          { k: "all",      label: "All" },
        ].map((t) => (
          <button key={t.k} type="button" onClick={() => setFilter(t.k)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${filter === t.k ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} p-10 text-center`}>
          <p className={`text-sm ${adminMutedCls}`}>No {filter} requests.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className={`${adminCardCls} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold capitalize text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{r.type.replace("_", " ")}</span>
                    <p className="text-sm font-bold">{r.title}</p>
                    {r.amount_inr != null && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">₹{r.amount_inr.toLocaleString("en-IN")}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" :
                      r.status === "rejected" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}>{r.status}</span>
                  </div>
                  {r.details && <p className={`mt-1 text-xs ${adminMutedCls}`}>{r.details}</p>}
                  <p className={`mt-1 text-[11px] ${adminMutedCls}`}>
                    By {r.requested_by.split("@")[0]} · {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {r.decided_by && ` · ${r.status} by ${r.decided_by.split("@")[0]}`}
                    {r.decision_note && ` — "${r.decision_note}"`}
                  </p>
                </div>
                {canDecide && r.status === "pending" && (
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => decide(r.id, "approved")} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">
                      <Check className="h-3.5 w-3.5" />Approve
                    </button>
                    <button type="button" onClick={() => decide(r.id, "rejected")} className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
                      <Ban className="h-3.5 w-3.5" />Reject
                    </button>
                  </div>
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
