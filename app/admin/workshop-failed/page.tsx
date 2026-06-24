"use client";

// ============================================================
// /admin/workshop-failed — failed / incomplete ₹99 workshop payments
// (live from Razorpay). One click resends the correct date's payment
// page to the customer on WhatsApp.
// ============================================================

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, ShieldCheck } from "lucide-react";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { SLOT_LABEL, resendWhatsAppLink } from "@/lib/workshopPages";

type Failed = {
  payment_id: string;
  email: string | null;
  phone: string | null;
  created_at: number;
  slot: string | null;
};

function fmt(ts: number) {
  return new Date(ts * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminWorkshopFailedPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } = useAdminPermissions();
  const canView = has("customers.view");

  const [rows, setRows] = useState<Failed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/workshop-failed", {
        headers: { Authorization: `Bearer ${s.session?.access_token ?? ""}` },
      });
      const json = await res.json();
      if (json.ok) setRows(json.failed as Failed[]);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access...
      </main>
    );
  }
  if (!authEmail || !isAdmin || !canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>customers.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="customers"
      breadcrumbs={[{ label: "Workshop — Failed Payments" }]}
      title="Failed Payments · Resend"
      subtitle={`${rows.length} people started ₹99 payment but didn't complete (last 30 days)`}
      email={authEmail}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      <p className={`mb-4 text-xs ${adminMutedCls}`}>
        These are live from Razorpay. People who later paid are hidden automatically. Tap “Resend”
        to open WhatsApp with the correct date’s payment link ready to send.
      </p>

      {loading ? (
        <div className={`${adminCardCls} p-6 text-center text-sm ${adminMutedCls}`}>Loading from Razorpay…</div>
      ) : rows.length === 0 ? (
        <div className={`${adminCardCls} p-8 text-center text-sm ${adminMutedCls}`}>
          No pending failed payments. 🎉
        </div>
      ) : (
        <div className={`${adminCardCls}`}>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((r) => (
              <li key={r.payment_id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{r.email || r.phone || "—"}</p>
                  <p className={`truncate text-xs ${adminMutedCls}`}>
                    {r.phone || "no phone"} · {fmt(r.created_at)}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300 sm:inline-block">
                  {r.slot ? SLOT_LABEL[r.slot] || r.slot : "date unknown"}
                </span>
                {r.phone && r.slot ? (
                  <a
                    href={resendWhatsAppLink(r.phone, r.slot)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500"
                  >
                    Resend on WhatsApp
                  </a>
                ) : (
                  <span className="shrink-0 text-[11px] font-bold text-slate-400">
                    {r.phone ? "no slot" : "no phone"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminShell>
  );
}
