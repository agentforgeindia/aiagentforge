"use client";

// /admin/influencer-withdrawals — manage influencer payout requests.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, RefreshCw, ShieldCheck, XCircle, Repeat } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Row = {
  id: string;
  candidate_id: string;
  referral_code: string;
  amount: number;
  status: string;
  upi_id: string | null;
  payout_id: string | null;
  payout_mode: string | null;
  failure_reason: string | null;
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
  creator: { name: string; email: string; mobile: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  requested:  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  paid:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected:   "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  failed:     "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function AdminWithdrawalsPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail } = useAdminPermissions();

  const [rows, setRows] = useState<Row[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rxConfigured, setRxConfigured] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingRows(true);
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token ?? "";
      const res = await fetch("/api/admin/influencer-withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) { setRows(json.rows as Row[]); setRxConfigured(!!json.razorpayx); }
      setLoadingRows(false);
    })();
  }, [isAdmin, refreshKey]);

  async function act(id: string, action: "mark_paid" | "reject" | "retry") {
    if (action === "reject" && !confirm("Reject this withdrawal request?")) return;
    if (action === "mark_paid" && !confirm("Mark this withdrawal as PAID? Do this only after the money is actually transferred.")) return;
    setBusyId(id);
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? "";
    const res = await fetch("/api/admin/influencer-withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, action }),
    });
    const json = await res.json();
    setBusyId(null);
    if (!json.ok) { alert(json.error ?? "Action failed."); return; }
    setRefreshKey(k => k + 1);
  }

  const stats = useMemo(() => {
    const pending = rows.filter(r => ["requested", "processing"].includes(r.status));
    const pendingAmt = pending.reduce((s, r) => s + Number(r.amount), 0);
    const paidAmt = rows.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
    return { pendingCount: pending.length, pendingAmt, paidAmt };
  }, [rows]);

  const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (loadingAuth) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking access…</main>;
  }
  if (!authEmail || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">Admin access required.</p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="finance"
      breadcrumbs={[{ label: "Influencer Withdrawals" }]}
      title="Influencer Withdrawals"
      subtitle={`${stats.pendingCount} pending · ₹${stats.pendingAmt.toLocaleString("en-IN")} to settle · ₹${stats.paidAmt.toLocaleString("en-IN")} paid`}
      email={authEmail}
      actions={
        <button type="button" onClick={() => setRefreshKey(k => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      {!rxConfigured && (
        <div className="mb-4 rounded-lg border border-amber-300/40 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
          ⚠️ RazorpayX is not configured (set RAZORPAYX_ACCOUNT_NUMBER). Auto-payouts are off — settle these manually and click “Mark Paid”.
        </div>
      )}

      <div className={`${adminCardCls} overflow-x-auto`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No withdrawal requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">UPI</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/60">
                  <td className="px-4 py-3">
                    <p className="font-bold">{r.creator?.name ?? "—"}</p>
                    <p className={`text-[11px] ${adminMutedCls}`}>{r.creator?.email ?? r.referral_code}</p>
                  </td>
                  <td className="px-4 py-3 font-black tabular-nums">₹{Number(r.amount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.upi_id ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${STATUS_STYLES[r.status] ?? STATUS_STYLES.requested}`}>
                      {r.status}
                    </span>
                    {r.payout_id && <p className={`mt-1 font-mono text-[10px] ${adminMutedCls}`}>{r.payout_id}</p>}
                    {r.failure_reason && <p className="mt-1 text-[10px] font-bold text-rose-500">{r.failure_reason}</p>}
                  </td>
                  <td className={`px-4 py-3 text-xs ${adminMutedCls}`}>{fmt(r.requested_at)}</td>
                  <td className="px-4 py-3">
                    {["requested", "processing", "failed"].includes(r.status) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {rxConfigured && (
                          <button disabled={busyId === r.id} onClick={() => act(r.id, "retry")}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500 disabled:opacity-50">
                            <Repeat className="h-3 w-3" /> Pay via UPI
                          </button>
                        )}
                        <button disabled={busyId === r.id} onClick={() => act(r.id, "mark_paid")}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                          <CheckCircle2 className="h-3 w-3" /> Mark Paid
                        </button>
                        <button disabled={busyId === r.id} onClick={() => act(r.id, "reject")}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs ${adminMutedCls}`}>
                        {r.processed_at ? fmt(r.processed_at) : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
