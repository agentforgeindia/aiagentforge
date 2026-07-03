"use client";

// ============================================================
// /admin/onsite-training — bookings from the public /onsite-training
// page (7/8/9 July — Pune/Satara/Kolhapur). Confirm, mark completed,
// or cancel; view uploaded showroom/product photos.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, ShieldCheck, ExternalLink } from "lucide-react";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Booking = {
  id: string;
  company_name: string;
  contact_person: string;
  mobile: string;
  email: string | null;
  city: string;
  address: string | null;
  industry_type: string | null;
  staff_count: string | null;
  preferred_date: string;
  preferred_time: string;
  photo_urls: string[] | null;
  notes: string | null;
  status: "new" | "confirmed" | "completed" | "cancelled";
  created_at: string;
};

type Counts = {
  total: number;
  new: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  byCity: { label: string; count: number }[];
};

const STATUS_STYLE: Record<Booking["status"], string> = {
  new: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  confirmed: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const NEXT_ACTIONS: Record<Booking["status"], { label: string; next: Booking["status"] }[]> = {
  new: [
    { label: "Confirm", next: "confirmed" },
    { label: "Cancel", next: "cancelled" },
  ],
  confirmed: [
    { label: "Mark Completed", next: "completed" },
    { label: "Cancel", next: "cancelled" },
  ],
  completed: [],
  cancelled: [{ label: "Reopen", next: "new" }],
};

export default function AdminOnsiteTrainingPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } = useAdminPermissions();
  const canView = has("leads.view") || isAdmin;

  const [rows, setRows] = useState<Booking[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string>("all");

  const token = useMemo(
    () => async () => (await supabase.auth.getSession()).data.session?.access_token ?? "",
    [],
  );

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const res = await fetch("/api/admin/onsite-training", {
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const j = await res.json();
      if (j.ok) {
        setRows(j.bookings as Booking[]);
        setCounts(j.counts);
      }
      setLoadingRows(false);
    })();
  }, [canView, refreshKey, token]);

  const updateStatus = async (id: string, status: Booking["status"]) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/onsite-training", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ id, status }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Could not update.");
        return;
      }
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
  const visible = cityFilter === "all" ? rows : rows.filter((r) => r.city === cityFilter);

  return (
    <AdminShell
      doodleType="leads"
      breadcrumbs={[{ label: "On-Site Training" }]}
      title="On-Site Training Bookings"
      subtitle="7/8/9 July — Pune / Satara / Kolhapur. Confirm the visit, then mark completed after the trainer's session."
      email={authEmail}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {counts && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black">{counts.total}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>Total</p>
          </div>
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black text-amber-600">{counts.new}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>New</p>
          </div>
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black text-cyan-600">{counts.confirmed}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>Confirmed</p>
          </div>
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black text-emerald-600">{counts.completed}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>Completed</p>
          </div>
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black text-rose-600">{counts.cancelled}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>Cancelled</p>
          </div>
        </div>
      )}

      {counts && counts.byCity.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCityFilter("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              cityFilter === "all" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            }`}
          >
            All cities
          </button>
          {counts.byCity.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setCityFilter(c.label)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                cityFilter === c.label ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
              }`}
            >
              {c.label} ({c.count})
            </button>
          ))}
        </div>
      )}

      <div className={adminCardCls}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading...</p>
        ) : visible.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {visible.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {/* Uploaded photos */}
                  {r.photo_urls && r.photo_urls.length > 0 && (
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {r.photo_urls.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="showroom/product"
                            className="h-16 w-16 rounded-lg border border-black/10 object-cover dark:border-white/10"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold">{r.company_name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_STYLE[r.status]}`}>
                        {r.status}
                      </span>
                      {r.industry_type && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {r.industry_type}
                        </span>
                      )}
                    </div>

                    <p className={`mt-1 text-xs ${adminMutedCls}`}>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{r.contact_person}</span>
                      {" · "}
                      <a href={waLink(r.mobile)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-emerald-600">
                        {r.mobile} <ExternalLink className="h-3 w-3" />
                      </a>
                      {r.email ? ` · ${r.email}` : ""}
                    </p>

                    <p className="mt-1 text-xs">
                      <span className="font-bold">📍 {r.city}</span>
                      {r.address ? ` — ${r.address}` : ""}
                    </p>

                    <p className={`mt-1 text-[11px] ${adminMutedCls}`}>
                      {new Date(`${r.preferred_date}T00:00:00+05:30`).toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      · {r.preferred_time}
                      {r.staff_count ? ` · ${r.staff_count} staff` : ""}
                      {" · Booked "}
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </p>

                    {r.notes && (
                      <p className="mt-1.5 rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] dark:bg-white/[0.04]">
                        <span className="font-bold">Notes:</span> {r.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {NEXT_ACTIONS[r.status].map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => updateStatus(r.id, a.next)}
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:text-white"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
