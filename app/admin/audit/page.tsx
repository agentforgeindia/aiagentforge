"use client";

// ============================================================
// /admin/audit — sensitive-action ledger viewer.
// ============================================================
// Reads public.admin_audit (RLS only lets users with the
// audit.view permission see rows). Shows: when, actor, action,
// target_type/id, expandable details JSON.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Search, ShieldCheck } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Row = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

const RANGES = [
  { value: "all",   label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d",    label: "Last 7 days" },
  { value: "30d",   label: "Last 30 days" },
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
  return null;
}

// Map raw action strings to a friendlier label + colour.
function actionLabel(a: string): { label: string; tone: string } {
  const map: Record<string, { label: string; tone: string }> = {
    "team.add":           { label: "Team member added",  tone: "emerald" },
    "team.edit_role":     { label: "Role changed",       tone: "amber" },
    "team.activate":      { label: "Member activated",   tone: "emerald" },
    "team.deactivate":    { label: "Member deactivated", tone: "rose" },
    "payments.manual":    { label: "Manual payment",     tone: "indigo" },
    "invoices.refund":    { label: "Refund issued",      tone: "rose" },
    "credits.grant":      { label: "Credits granted",    tone: "emerald" },
    "credits.deduct":     { label: "Credits deducted",   tone: "rose" },
  };
  return map[a] ?? { label: a, tone: "slate" };
}

const TONE_STYLES: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rose:    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  amber:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  indigo:  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  slate:   "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function AdminAuditPage() {
  const { loading, has, email } = useAdminPermissions();
  const canView = has("audit.view");

  const [rows, setRows] = useState<Row[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [range, setRange] = useState("7d");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      let q = supabase
        .from("admin_audit")
        .select(
          "id, actor_email, action, target_type, target_id, details, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300);

      const since = startOfRange(range);
      if (since) q = q.gte("created_at", since.toISOString());

      const { data, error } = await q;
      if (!error && data) setRows(data as Row[]);
      else if (error)
        console.error("[admin/audit] load failed:", error.message);
      setLoadingRows(false);
    })();
  }, [canView, range, refreshKey]);

  const knownActions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.action);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const qs = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (!qs) return true;
      const hay = `${r.actor_email ?? ""} ${r.action} ${r.target_type ?? ""} ${r.target_id ?? ""}`.toLowerCase();
      return hay.includes(qs);
    });
  }, [rows, search, actionFilter]);

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
            Your role does not include the <code>audit.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      breadcrumbs={[{ label: "Audit log" }]}
      title="Audit log"
      subtitle={`${filtered.length} entr${filtered.length === 1 ? "y" : "ies"} in the current view`}
      email={email}
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
      {/* Filters */}
      <div className={`${adminCardCls} flex flex-col gap-2 p-3 sm:flex-row`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor / action / target"
            className={`${adminInputCls} pl-9`}
          />
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className={`${adminInputCls} sm:max-w-[180px]`}
        >
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className={`${adminInputCls} sm:max-w-[200px]`}
        >
          <option value="all">All actions</option>
          {knownActions.map((a) => (
            <option key={a} value={a}>
              {actionLabel(a).label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            {rows.length === 0
              ? "No audit entries in this range."
              : "Nothing matches the current filter."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((r) => {
              const { label, tone } = actionLabel(r.action);
              return (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${TONE_STYLES[tone]}`}
                    >
                      {label}
                    </span>
                    {r.target_type && (
                      <span
                        className={`text-[11px] font-bold uppercase tracking-[0.14em] ${adminMutedCls}`}
                      >
                        {r.target_type}
                      </span>
                    )}
                    <span className={`text-[11px] ${adminMutedCls}`}>
                      {formatDateTime(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm">
                    by{" "}
                    <span className="font-bold">
                      {r.actor_email ?? "(unknown)"}
                    </span>
                    {r.target_id && (
                      <>
                        {" "}
                        on{" "}
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {r.target_id}
                        </span>
                      </>
                    )}
                  </p>
                  {r.details && Object.keys(r.details).length > 0 && (
                    <details className="mt-1">
                      <summary
                        className={`cursor-pointer text-[11px] font-bold uppercase tracking-[0.14em] ${adminMutedCls}`}
                      >
                        Details
                      </summary>
                      <pre className="mt-1 max-h-44 overflow-auto rounded-md bg-slate-900 p-2 text-[11px] leading-5 text-slate-100">
                        {JSON.stringify(r.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
