"use client";

// ============================================================
// /admin/customers — signed-up users with corporate styling.
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronRight, Download, RefreshCw, Search, ShieldCheck } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { useAdminPermissions } from "../AdminPermissions";

type CustomerRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  credits: number;
  plan: string | null;
  updated_at: string | null;
  created_at: string | null;
  health_score: number | null;
  health_status: string | null;
  referred_by: string | null;
  billing_phone: string | null;
};

type PlanFilter = "all" | "Starter" | "Pro Creator" | "Empire" | "Free";
type HealthFilter = "all" | "healthy" | "active" | "at_risk" | "churn_risk" | "churned";

export default function AdminCustomersPage() {
  // RBAC-driven access — no hard-coded email allowlist. Roles +
  // permissions live in admin_roles / admin_users.
  const {
    loading: loadingAuth,
    isAdmin,
    email: authEmail,
    has,
  } = useAdminPermissions();
  const canViewCustomers = has("customers.view");

  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!canViewCustomers) return;
    setLoadingRows(true);
    (async () => {
      // Use service-role API to bypass RLS — anon client misses records
      // where updated_at is null or RLS policy doesn't match.
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token ?? "";
      const res = await fetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) setRows(json.profiles as CustomerRow[]);
      setLoadingRows(false);
    })();
  }, [canViewCustomers, refreshKey]);

  // Normalize plan: null / "free" / "Free" → "Free" for consistent comparison
  function normPlan(p: string | null) {
    if (!p || p.toLowerCase() === "free") return "Free";
    return p;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (planFilter !== "all") {
        if (normPlan(r.plan) !== planFilter) return false;
      }
      if (healthFilter !== "all") {
        if ((r.health_status ?? "") !== healthFilter) return false;
      }
      if (q) {
        const hay = `${r.email ?? ""} ${r.full_name ?? ""} ${r.billing_phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, planFilter, healthFilter, search]);

  const stats = useMemo(() => {
    const total   = rows.length;
    const free    = rows.filter(r => normPlan(r.plan) === "Free").length;
    const paying  = rows.filter(r => normPlan(r.plan) !== "Free").length;
    const referred = rows.filter(r => !!r.referred_by).length;
    return { total, free, paying, referred };
  }, [rows]);

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }
  if (!authEmail || !isAdmin || !canViewCustomers) {
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
      breadcrumbs={[{ label: "Customers" }]}
      title="Customers"
      subtitle={`${stats.total} total · ${stats.free} free · ${stats.paying} paid · ${stats.referred} via referral`}
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
                "joined_at","email","full_name","plan","credits",
                "health_status","health_score",
              ];
              const csvRows = filtered.map((r) => [
                r.created_at, r.email, r.full_name, r.plan, r.credits,
                r.health_status, r.health_score,
              ]);
              const ts = new Date().toISOString().slice(0, 10);
              downloadCsv(`agentforge-customers-${ts}.csv`, buildCsv(headers, csvRows));
            }}
            className={adminSecondaryBtnCls}
            title="Download the filtered customers as a CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </>
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
            placeholder="Search by email or name"
            className={`${adminInputCls} pl-9`}
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
          className={`${adminInputCls} sm:max-w-[160px]`}
        >
          <option value="all">All plans</option>
          <option value="Free">Free</option>
          <option value="Starter">Starter</option>
          <option value="Pro Creator">Pro Creator</option>
          <option value="Empire">Empire</option>
        </select>
        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value as HealthFilter)}
          className={`${adminInputCls} sm:max-w-[160px]`}
        >
          <option value="all">All health</option>
          <option value="healthy">Healthy</option>
          <option value="active">Active</option>
          <option value="at_risk">At risk</option>
          <option value="churn_risk">Churn risk</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      {/* List */}
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            {rows.length === 0
              ? "No users have signed up yet."
              : "No customers match the current filter."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/customers/${r.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold">
                        {r.full_name?.trim() || r.email || "—"}
                      </p>
                      <PlanChip plan={r.plan} />
                      <HealthChip status={r.health_status} score={r.health_score} />
                      {r.referred_by && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">
                          🔗 ref:{r.referred_by}
                        </span>
                      )}
                    </div>
                    <p className={`mt-0.5 truncate text-xs ${adminMutedCls}`}>
                      {r.email ?? "(no email)"}
                      {r.billing_phone && ` · ${r.billing_phone}`}
                      {" · "}
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold tabular-nums">
                      {Number(r.credits).toLocaleString("en-IN")}
                    </p>
                    <p className={`text-[10px] uppercase tracking-[0.16em] ${adminMutedCls}`}>
                      credits
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

const PLAN_STYLES: Record<string, string> = {
  Empire:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
  "Pro Creator":
    "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  Starter:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  Free:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function PlanChip({ plan }: { plan: string | null }) {
  // Normalize "free" → "Free" so style lookup always works
  const raw = plan ?? "free";
  const effective = raw.toLowerCase() === "free" ? "Free" : raw;
  const cls = PLAN_STYLES[effective] ?? PLAN_STYLES.Free;
  return (
    <span
      className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${cls}`}
    >
      {effective}
    </span>
  );
}

const HEALTH_STYLES: Record<string, string> = {
  healthy:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  active:     "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  at_risk:    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  churn_risk: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  churned:    "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const HEALTH_LABELS: Record<string, string> = {
  healthy:    "Healthy",
  active:     "Active",
  at_risk:    "At risk",
  churn_risk: "Churn risk",
  churned:    "Churned",
};

function HealthChip({
  status,
  score,
}: {
  status: string | null;
  score: number | null;
}) {
  if (!status) return null;
  const cls = HEALTH_STYLES[status] ?? HEALTH_STYLES.churned;
  const label = HEALTH_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${cls}`}
      title={`Health score: ${score ?? "—"} / 100`}
    >
      {label}
      {score !== null && (
        <span className="font-mono opacity-80">{score}</span>
      )}
    </span>
  );
}

