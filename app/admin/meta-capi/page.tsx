"use client";

// ============================================================
// /admin/meta-capi — Meta Conversions API event log. Shows what was
// sent to Meta (Purchase / Lead), to whom, value, and accept/fail.
// ============================================================

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { GradientStat } from "../StatCards";
import { useAdminPermissions } from "../AdminPermissions";

type Ev = {
  id: string;
  event_name: string;
  email: string | null;
  phone: string | null;
  value: number | null;
  currency: string | null;
  ok: boolean;
  status_code: number | null;
  error: string | null;
  created_at: string;
};
type Summary = {
  total: number;
  last24: number;
  sent24: number;
  failed24: number;
  purchases24: number;
  revenue24: number;
};

function timeStr(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMetaCapiPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } =
    useAdminPermissions();
  const canView = has("marketing.view") || has("settings.view");

  const [events, setEvents] = useState<Ev[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token ?? "";
      const res = await fetch("/api/admin/meta-capi-events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        setEvents(json.events as Ev[]);
        setSummary(json.summary as Summary | null);
      }
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
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
            Your role does not include the <code>marketing.view</code>{" "}
            permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="analytics"
      breadcrumbs={[{ label: "Meta CAPI" }]}
      title="Meta Conversions API"
      subtitle="Server events sent to Meta — Purchase, Lead, and delivery status"
      email={authEmail}
      actions={
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className={adminSecondaryBtnCls}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : (
        <div className="space-y-4">
          {summary && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <GradientStat label="Sent (24h)" value={summary.sent24} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
              <GradientStat label="Failed (24h)" value={summary.failed24} gradient={summary.failed24 > 0 ? "bg-gradient-to-br from-rose-500 to-red-600" : "bg-gradient-to-br from-slate-500 to-slate-700"} />
              <GradientStat label="Purchases (24h)" value={summary.purchases24} gradient="bg-gradient-to-br from-indigo-500 to-violet-600" />
              <GradientStat label="Tracked revenue (24h)" value={`₹${summary.revenue24.toLocaleString("en-IN")}`} gradient="bg-gradient-to-br from-fuchsia-500 to-pink-600" />
            </div>
          )}

          <div className={`${adminCardCls} overflow-hidden`}>
            {events.length === 0 ? (
              <div className="p-8 text-center">
                <p className={`text-sm ${adminMutedCls}`}>No events sent yet.</p>
                <p className={`mt-1 text-xs ${adminMutedCls}`}>
                  Events appear here after a payment or ad lead — and once{" "}
                  <code>META_CAPI_TOKEN</code> is set and{" "}
                  <code>meta-capi-events.sql</code> has been run.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="px-4 py-2 font-bold">Event</th>
                      <th className="px-3 py-2 font-bold">Contact</th>
                      <th className="px-3 py-2 text-right font-bold">Value</th>
                      <th className="px-3 py-2 text-center font-bold">Status</th>
                      <th className="px-3 py-2 text-right font-bold">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                        <td className="px-4 py-2 font-bold">{e.event_name}</td>
                        <td className="px-3 py-2">
                          <span className="block truncate">{e.email || e.phone || "—"}</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {e.value != null ? `₹${Number(e.value).toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {e.ok ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title={`HTTP ${e.status_code ?? ""}`}>
                              <CheckCircle2 className="h-4 w-4" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400" title={e.error ?? `HTTP ${e.status_code ?? ""}`}>
                              <XCircle className="h-4 w-4" /> Failed
                            </span>
                          )}
                        </td>
                        <td className={`px-3 py-2 text-right text-xs ${adminMutedCls}`}>
                          {timeStr(e.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
