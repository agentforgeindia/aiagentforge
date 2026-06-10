"use client";

// ============================================================
// /admin/workshop-certificates — who downloaded a workshop
// certificate (name, email, workshop date, time).
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Award, Download, RefreshCw, Search, ShieldCheck } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { useAdminPermissions } from "../AdminPermissions";

type CertRow = {
  id: string;
  name: string;
  email: string;
  certificate_date: string;
  created_at: string;
};

type SlotRow = {
  slot_id: string;
  label: string;
  seats_filled: number;
  max_seats: number;
};

function formatDateTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminWorkshopCertificatesPage() {
  const {
    loading: loadingAuth,
    isAdmin,
    email: authEmail,
    has,
  } = useAdminPermissions();
  const canView = has("customers.view");

  const [rows, setRows] = useState<CertRow[]>([]);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token ?? "";
      const res = await fetch("/api/admin/workshop-certificates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        setRows(json.certificates as CertRow[]);
        setSlots((json.slots ?? []) as SlotRow[]);
      }
      setLoadingRows(false);
    })();
  }, [canView, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.name} ${r.email} ${r.certificate_date}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const unique = new Set(rows.map((r) => (r.email ?? "").toLowerCase())).size;
    return { total, unique };
  }, [rows]);

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
            Your role does not include the <code>customers.view</code>{" "}
            permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="customers"
      breadcrumbs={[{ label: "Workshop Certificates" }]}
      title="Workshop Certificates"
      subtitle={`${stats.total} downloads · ${stats.unique} unique emails`}
      email={authEmail}
      actions={
        <>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className={adminSecondaryBtnCls}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() => {
              const headers = ["downloaded_at", "name", "email", "workshop_date"];
              const csvRows = filtered.map((r) => [
                r.created_at,
                r.name,
                r.email,
                r.certificate_date,
              ]);
              const ts = new Date().toISOString().slice(0, 10);
              downloadCsv(
                `workshop-certificates-${ts}.csv`,
                buildCsv(headers, csvRows),
              );
            }}
            className={adminSecondaryBtnCls}
            title="Download the filtered list as a CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </>
      }
    >
      {/* Seat counts per slot */}
      {slots.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((s) => (
            <div key={s.slot_id} className={`${adminCardCls} p-3`}>
              <p className={`text-[11px] ${adminMutedCls}`}>{s.label}</p>
              <p className="mt-1 text-lg font-bold">
                {s.seats_filled}
                <span className={`text-xs font-normal ${adminMutedCls}`}>
                  {" "}
                  / {s.max_seats} seats
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className={`${adminCardCls} flex flex-col gap-2 p-3 sm:flex-row`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or date"
            className={`${adminInputCls} pl-9`}
          />
        </div>
      </div>

      {/* List */}
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            {rows.length === 0
              ? "No certificates downloaded yet."
              : "No records match your search."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-500/10">
                  <Award className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{r.name}</p>
                  <p className={`truncate text-xs ${adminMutedCls}`}>
                    {r.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{r.certificate_date}</p>
                  <p className={`text-[11px] ${adminMutedCls}`}>
                    {formatDateTime(r.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
