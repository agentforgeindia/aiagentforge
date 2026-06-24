"use client";

// ============================================================
// /admin/workshop-reviews — approve / reject attendee reviews.
// Approved ones show on the public /workshop page.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, ShieldCheck, Star, Trash2 } from "lucide-react";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Review = {
  id: string;
  name: string;
  email: string | null;
  rating: number;
  feedback_points: string[];
  suggestions: string | null;
  logo_url: string | null;
  photo_url: string | null;
  consent: boolean;
  status: string;
  created_at: string;
};

function fmt(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminWorkshopReviewsPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } = useAdminPermissions();
  const canView = has("customers.view");

  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  const token = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const res = await fetch("/api/admin/workshop-reviews", {
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const json = await res.json();
      if (json.ok) setRows(json.reviews as Review[]);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  const setStatus = async (id: string, status: string) => {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch("/api/admin/workshop-reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setRows((p) => p.filter((r) => r.id !== id));
    await fetch(`/api/admin/workshop-reviews?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${await token()}` },
    }).catch(() => {});
  };

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 } as Record<string, number>;
    rows.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [rows]);

  const filtered = rows.filter((r) => r.status === tab);

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
      breadcrumbs={[{ label: "Workshop Reviews" }]}
      title="Workshop Reviews"
      subtitle={`${counts.pending || 0} pending · ${counts.approved || 0} live on site`}
      email={authEmail}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {/* Tabs */}
      <div className="mb-4 flex items-center gap-2">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${
              tab === t
                ? "bg-slate-900 text-white dark:bg-indigo-600"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {t} ({counts[t] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className={`${adminCardCls} p-6 text-center text-sm ${adminMutedCls}`}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} p-8 text-center text-sm ${adminMutedCls}`}>No {tab} reviews.</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className={`${adminCardCls} p-4`}>
              <div className="flex items-start gap-3">
                {r.photo_url || r.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(r.photo_url || r.logo_url) as string} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700">
                    {r.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{r.name}</p>
                  <p className={`truncate text-[11px] ${adminMutedCls}`}>{r.email || "no email"} · {fmt(r.created_at)}</p>
                  <div className="mt-0.5 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    ))}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.consent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {r.consent ? "consent ✓" : "no consent"}
                </span>
              </div>

              {r.suggestions && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">“{r.suggestions}”</p>}

              {r.feedback_points?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.feedback_points.map((p) => (
                    <span key={p} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {r.status !== "approved" && (
                  <button type="button" onClick={() => setStatus(r.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500">
                    ✓ Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button type="button" onClick={() => setStatus(r.id, "rejected")} className="rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-400">
                    Reject
                  </button>
                )}
                {r.status !== "pending" && (
                  <button type="button" onClick={() => setStatus(r.id, "pending")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                    Move to pending
                  </button>
                )}
                <button type="button" onClick={() => remove(r.id)} className="ml-auto rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
