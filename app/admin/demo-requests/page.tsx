"use client";

// ============================================================
// /admin/demo-requests — incoming "Book a Customize Demo" requests.
// Team builds the demo, sends it on WhatsApp, then clicks
// "Mark demo sent" → number flows into the leads pipeline.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, ShieldCheck, ExternalLink, CheckCircle2 } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type DemoReq = {
  id: string;
  agent: string;
  output_desc: string | null;
  output_size: string | null;
  quality: string | null;
  device: string | null;
  whatsapp: string;
  design_url: string | null;
  logo_url: string | null;
  status: string;
  lead_id: string | null;
  created_at: string;
};

export default function AdminDemoRequestsPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } = useAdminPermissions();
  const canView = has("leads.view");

  const [rows, setRows] = useState<DemoReq[]>([]);
  const [counts, setCounts] = useState<{ total: number; new: number; sent: number } | null>(null);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const token = useMemo(
    () => async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? "";
    },
    [],
  );

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const res = await fetch("/api/admin/demo-requests", {
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const json = await res.json();
      if (json.ok) { setRows(json.requests as DemoReq[]); setCounts(json.counts); }
      setLoadingRows(false);
    })();
  }, [canView, refreshKey, token]);

  const markSent = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.error || "Could not update."); return; }
      setRefreshKey((k) => k + 1);
    } finally {
      setBusyId(null);
    }
  };

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
            Your role does not include the <code>leads.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  const waLink = (num: string) => `https://wa.me/${num.replace(/\D/g, "")}`;

  return (
    <AdminShell
      doodleType="customers"
      breadcrumbs={[{ label: "Demo Requests" }]}
      title="Customize Demo Requests"
      subtitle="Build the demo, send it on WhatsApp, then mark it sent — number flows to Leads"
      email={authEmail}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {counts && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black">{counts.total}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>Total requests</p>
          </div>
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black text-amber-600">{counts.new}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>New (pending)</p>
          </div>
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black text-emerald-600">{counts.sent}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>Demo sent</p>
          </div>
        </div>
      )}

      <div className={adminCardCls}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading...</p>
        ) : rows.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No demo requests yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                {r.design_url && (
                  <a href={r.design_url} target="_blank" rel="noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.design_url} alt="design" className="h-20 w-20 rounded-lg border border-black/10 object-cover dark:border-white/10" />
                  </a>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{r.agent}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                      r.status === "new"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    }`}>
                      {r.status === "new" ? "New" : "Demo sent"}
                    </span>
                    {r.logo_url && (
                      <a href={r.logo_url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-cyan-600 underline">
                        logo
                      </a>
                    )}
                  </div>
                  {r.output_desc && <p className={`mt-1 text-xs ${adminMutedCls}`}>{r.output_desc}</p>}
                  <p className={`mt-1 text-[11px] ${adminMutedCls}`}>
                    {r.device ? `${r.device === "Mobile" ? "📱" : "💻"} ${r.device} · ` : ""}{r.output_size || "—"} · {r.quality || "—"} · {new Date(r.created_at).toLocaleString("en-IN")}
                  </p>
                  <a href={waLink(r.whatsapp)} target="_blank" rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    {r.whatsapp} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="shrink-0">
                  {r.status === "new" ? (
                    <button
                      type="button"
                      onClick={() => markSent(r.id)}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {busyId === r.id ? "..." : "Mark demo sent"}
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600">→ in Leads</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
