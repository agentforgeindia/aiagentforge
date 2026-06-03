"use client";

// ============================================================
// /admin/invoices — central listing of every payment / bill
// across the platform. Admins with invoices.view_all can search,
// filter, and open the customer-side /invoice/[id] view.
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Receipt, RefreshCw, Search, ShieldCheck } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { buildCsv, downloadCsv } from "@/lib/csv";

type Row = {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  credits_added: number;
  status: string;
  razorpay_payment_id: string | null;
  created_at: string;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
};

const RANGE_OPTIONS = [
  { value: "all",    label: "All time" },
  { value: "today",  label: "Today" },
  { value: "7d",     label: "Last 7 days" },
  { value: "30d",    label: "Last 30 days" },
  { value: "fy",     label: "Current FY" },
];

function startOfRange(range: string): Date | null {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (range === "fy") {
    // Indian FY = April–March. If current month < April, FY started
    // in April of last year.
    const y = now.getFullYear();
    const fyYear = now.getMonth() >= 3 ? y : y - 1;
    return new Date(fyYear, 3, 1); // April = month index 3
  }
  return null;
}

export default function AdminInvoicesPage() {
  const { loading, isAdmin, has, email } = useAdminPermissions();

  const [rows, setRows] = useState<Row[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [range, setRange] = useState("30d");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");

  const canView = isAdmin && has("invoices.view_all");

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      let q = supabase
        .from("payments")
        .select(
          "id, user_id, plan, amount, credits_added, status, razorpay_payment_id, created_at, billing_name, billing_email, billing_phone",
        )
        .order("created_at", { ascending: false })
        .limit(500);

      const since = startOfRange(range);
      if (since) q = q.gte("created_at", since.toISOString());

      const { data, error } = await q;
      if (!error && data) setRows(data as Row[]);
      else if (error)
        console.error("[admin/invoices] load error:", error.message);
      setLoadingRows(false);
    })();
  }, [canView, range, refreshKey]);

  const filtered = useMemo(() => {
    const qs = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (planFilter !== "all" && r.plan !== planFilter) return false;
      if (!qs) return true;
      const hay = `${r.billing_name ?? ""} ${r.billing_email ?? ""} ${r.billing_phone ?? ""} ${r.razorpay_payment_id ?? ""} ${r.plan}`.toLowerCase();
      return hay.includes(qs);
    });
  }, [rows, search, planFilter]);

  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.status === "paid");
    const total = paid.reduce((a, r) => a + Number(r.amount), 0);
    return { count: paid.length, total };
  }, [rows]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }

  if (!canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>invoices.view_all</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      breadcrumbs={[{ label: "Invoices" }]}
      title="Invoices"
      subtitle={`${stats.count} paid · ₹${stats.total.toLocaleString("en-IN")} ${
        range === "all" ? "lifetime" : "in range"
      }`}
      email={email}
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
                "date","plan","amount","credits_added","status",
                "buyer_name","buyer_email","buyer_phone","razorpay_payment_id",
              ];
              const csvRows = filtered.map((r) => [
                r.created_at, r.plan, r.amount, r.credits_added, r.status,
                r.billing_name, r.billing_email, r.billing_phone, r.razorpay_payment_id,
              ]);
              const ts = new Date().toISOString().slice(0, 10);
              downloadCsv(`agentforge-invoices-${ts}.csv`, buildCsv(headers, csvRows));
            }}
            className={adminSecondaryBtnCls}
            title="Download the filtered invoices as a CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </>
      }
    >
      {/* Filters */}
      <div
        className={`${adminCardCls} flex flex-col gap-2 p-3 sm:flex-row sm:items-center`}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name / email / phone / payment id / plan"
            className={`${adminInputCls} pl-9`}
          />
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className={`${adminInputCls} sm:max-w-[160px]`}
        >
          {RANGE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className={`${adminInputCls} sm:max-w-[160px]`}
        >
          <option value="all">All plans</option>
          <option value="Starter">Starter</option>
          <option value="Pro Creator">Pro Creator</option>
          <option value="Empire">Empire</option>
        </select>
      </div>

      {/* List */}
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            {rows.length === 0
              ? "No payments in this range."
              : "No payments match the current filter."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={r.status} />
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {r.plan}
                    </span>
                    <span className={`text-[11px] ${adminMutedCls}`}>
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-bold">
                    {r.billing_name?.trim() ||
                      r.billing_email ||
                      "(unnamed buyer)"}
                  </p>
                  <p className={`mt-0.5 truncate text-xs ${adminMutedCls}`}>
                    {[r.billing_email, r.billing_phone]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">
                      ₹{Number(r.amount).toLocaleString("en-IN")}
                    </p>
                    <p className={`text-[10px] uppercase tracking-[0.12em] ${adminMutedCls}`}>
                      +{Number(r.credits_added).toLocaleString("en-IN")} cr
                    </p>
                  </div>
                  {has("invoices.download") && (
                    <Link
                      href={`/invoice/${r.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    >
                      <Download className="h-3 w-3" />
                      Bill
                    </Link>
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

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "paid"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : status === "refunded"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${cls}`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
