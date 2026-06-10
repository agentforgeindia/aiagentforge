"use client";

// ============================================================
// /admin/workshop-registrations — paid workshop attendees from
// Razorpay (leads + purchases): email, phone, amount, payment id.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, IndianRupee, RefreshCw, Search, ShieldCheck, Ticket } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { useAdminPermissions } from "../AdminPermissions";

type RegRow = {
  id: string;
  slot_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  amount: number | null;
  status: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
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

export default function AdminWorkshopRegistrationsPage() {
  const {
    loading: loadingAuth,
    isAdmin,
    email: authEmail,
    has,
  } = useAdminPermissions();
  const canView = has("customers.view");

  const [rows, setRows] = useState<RegRow[]>([]);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState("all");

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token ?? "";
      const res = await fetch("/api/admin/workshop-registrations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        setRows(json.registrations as RegRow[]);
        setSlots((json.slots ?? []) as SlotRow[]);
      }
      setLoadingRows(false);
    })();
  }, [canView, refreshKey]);

  const slotLabel = useMemo(() => {
    const map: Record<string, string> = {};
    slots.forEach((s) => (map[s.slot_id] = s.label));
    return map;
  }, [slots]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (slotFilter !== "all" && r.slot_id !== slotFilter) return false;
      if (q) {
        const hay =
          `${r.email ?? ""} ${r.phone ?? ""} ${r.name ?? ""} ${r.razorpay_payment_id ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, slotFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const revenue = filtered.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return { total, revenue };
  }, [filtered]);

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
      breadcrumbs={[{ label: "Workshop Registrations" }]}
      title="Workshop Registrations"
      subtitle={`${stats.total} paid attendees · ₹${stats.revenue.toLocaleString("en-IN")} collected`}
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
              const headers = [
                "paid_at", "slot", "name", "email", "phone",
                "amount", "razorpay_payment_id", "razorpay_order_id",
              ];
              const csvRows = filtered.map((r) => [
                r.created_at,
                slotLabel[r.slot_id] ?? r.slot_id,
                r.name,
                r.email,
                r.phone,
                r.amount,
                r.razorpay_payment_id,
                r.razorpay_order_id,
              ]);
              const ts = new Date().toISOString().slice(0, 10);
              downloadCsv(
                `workshop-registrations-${ts}.csv`,
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

      {/* Filters */}
      <div className={`${adminCardCls} flex flex-col gap-2 p-3 sm:flex-row`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, phone or payment id"
            className={`${adminInputCls} pl-9`}
          />
        </div>
        <select
          value={slotFilter}
          onChange={(e) => setSlotFilter(e.target.value)}
          className={`${adminInputCls} sm:max-w-[220px]`}
        >
          <option value="all">All dates</option>
          {slots.map((s) => (
            <option key={s.slot_id} value={s.slot_id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            {rows.length === 0
              ? "No paid registrations yet."
              : "No registrations match the current filter."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                  <Ticket className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {r.email || r.name || "—"}
                  </p>
                  <p className={`truncate text-xs ${adminMutedCls}`}>
                    {r.phone || "no phone"}
                    {r.razorpay_payment_id ? ` · ${r.razorpay_payment_id}` : ""}
                  </p>
                </div>
                <div className="hidden text-center sm:block">
                  <p className="text-xs font-bold">
                    {slotLabel[r.slot_id] ?? r.slot_id}
                  </p>
                  <p className={`text-[11px] ${adminMutedCls}`}>
                    {formatDateTime(r.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-right font-bold text-emerald-600">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {Number(r.amount) || 0}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
