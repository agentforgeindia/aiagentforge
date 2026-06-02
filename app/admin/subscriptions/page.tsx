"use client";

// ============================================================
// /admin/subscriptions — active plans with renewal tracking.
// ============================================================
// Shows every paying customer with their current plan + expiry.
// Buckets: Active · Expiring this week · Expired.
// Per-row quick actions:
//   • Extend +30 days (subscriptions.extend permission)
//   • Create renewal task (subscriptions.create_task)
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CalendarPlus,
  CheckSquare,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Sub = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string | null;
  credits: number;
  plan_purchased_at: string | null;
  plan_expires_at: string | null;
};

type ViewMode = "all" | "active" | "expiring" | "expired";

const PLAN_STYLES: Record<string, string> = {
  Empire:       "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
  "Pro Creator":"bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  Starter:     "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
};

export default function AdminSubscriptionsPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("subscriptions.view");
  const canExtend = has("subscriptions.extend");
  const canCreateTask = has("subscriptions.create_task");

  const [rows, setRows] = useState<Sub[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<ViewMode>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, plan, credits, plan_purchased_at, plan_expires_at",
        )
        .not("plan_expires_at", "is", null)
        .order("plan_expires_at", { ascending: true })
        .limit(500);
      if (!error && data) setRows(data as Sub[]);
      setLoadingRows(false);
    })();
  }, [canView, refreshKey]);

  const now = useMemo(() => Date.now(), [refreshKey]);
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  function bucket(s: Sub): "active" | "expiring" | "expired" {
    if (!s.plan_expires_at) return "active";
    const t = new Date(s.plan_expires_at).getTime();
    if (t < now) return "expired";
    if (t < weekFromNow) return "expiring";
    return "active";
  }

  const filtered = useMemo(() => {
    const qs = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (view !== "all" && bucket(r) !== view) return false;
      if (qs) {
        const hay = `${r.email ?? ""} ${r.full_name ?? ""} ${r.plan ?? ""}`.toLowerCase();
        if (!hay.includes(qs)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, view, search, now]);

  const stats = useMemo(() => {
    const a: { active: number; expiring: number; expired: number } = {
      active: 0,
      expiring: 0,
      expired: 0,
    };
    for (const r of rows) a[bucket(r)]++;
    return { ...a, total: rows.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, now]);

  async function extend(userId: string, days: number) {
    if (!confirm(`Extend this subscription by ${days} days?`)) return;
    const { data, error } = await supabase.rpc("extend_subscription", {
      p_user_id: userId,
      p_days: days,
    });
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: "subscriptions.extend",
      p_target_type: "user",
      p_target_id: userId,
      p_details: { days, new_expiry: data },
    });
    setRefreshKey((k) => k + 1);
  }

  async function createRenewalTask(s: Sub) {
    const title = `Renewal call — ${s.full_name?.trim() || s.email || "customer"} (${s.plan ?? "—"})`;
    const due = s.plan_expires_at ?? new Date().toISOString();
    const { data: sess } = await supabase.auth.getSession();
    const created_by = sess.session?.user?.id ?? null;
    const { error } = await supabase.from("tasks").insert({
      title,
      type: "payment_reminder",
      status: "pending",
      priority: "high",
      related_customer_id: s.id,
      due_at: due,
      created_by,
    });
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    alert("Renewal task created.");
  }

  if (pLoading) {
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
            Your role does not include the <code>subscriptions.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      breadcrumbs={[{ label: "Subscriptions" }]}
      title="Subscriptions"
      subtitle={`${stats.active} active · ${stats.expiring} expiring this week · ${stats.expired} expired`}
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
      {/* View tabs */}
      <div className={`${adminCardCls} flex flex-col gap-2 p-3 sm:flex-row sm:items-center`}>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "active", "expiring", "expired"] as ViewMode[]).map((v) => {
            const count =
              v === "all" ? stats.total :
              v === "active" ? stats.active :
              v === "expiring" ? stats.expiring : stats.expired;
            const label =
              v === "all" ? "All" :
              v === "active" ? "Active" :
              v === "expiring" ? "Expiring · 7d" : "Expired";
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                  active
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {label}
                <span
                  className={`rounded px-1 text-[10px] tabular-nums ${
                    active ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email / name / plan"
            className={`${adminInputCls} pl-9`}
          />
        </div>
      </div>

      {/* List */}
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            {rows.length === 0
              ? "No subscriptions recorded yet — purchases populate this list."
              : "No subscriptions match the current view."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((r) => {
              const b = bucket(r);
              const daysLeft = r.plan_expires_at
                ? Math.ceil(
                    (new Date(r.plan_expires_at).getTime() - now) /
                      (24 * 60 * 60 * 1000),
                  )
                : null;
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <Link
                    href={`/admin/customers/${r.id}`}
                    className="group min-w-0 flex-1"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <PlanChip plan={r.plan} />
                      <BucketChip kind={b} daysLeft={daysLeft} />
                    </div>
                    <p className="mt-1 truncate text-sm font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      {r.full_name?.trim() || r.email || "—"}
                    </p>
                    <p className={`mt-0.5 truncate text-xs ${adminMutedCls}`}>
                      {r.email} · purchased{" "}
                      {r.plan_purchased_at ? formatDate(r.plan_purchased_at) : "—"} ·{" "}
                      expires{" "}
                      {r.plan_expires_at ? formatDate(r.plan_expires_at) : "—"}
                    </p>
                  </Link>

                  <div className="flex flex-wrap items-center gap-2">
                    {canCreateTask && (
                      <button
                        type="button"
                        onClick={() => createRenewalTask(r)}
                        className={adminSecondaryBtnCls}
                        title="Create a renewal task for the sales/accounts team"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        Task
                      </button>
                    )}
                    {canExtend && (
                      <button
                        type="button"
                        onClick={() => extend(r.id, 30)}
                        className={adminSecondaryBtnCls}
                        title="Extend the validity by 30 days"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        +30d
                      </button>
                    )}
                    <Link
                      href={`/admin/customers/${r.id}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function PlanChip({ plan }: { plan: string | null }) {
  if (!plan) return null;
  const cls =
    PLAN_STYLES[plan] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${cls}`}
    >
      {plan}
    </span>
  );
}

function BucketChip({
  kind,
  daysLeft,
}: {
  kind: "active" | "expiring" | "expired";
  daysLeft: number | null;
}) {
  if (kind === "active") {
    return (
      <span className="inline-flex rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        Active{daysLeft !== null ? ` · ${daysLeft}d` : ""}
      </span>
    );
  }
  if (kind === "expiring") {
    return (
      <span className="inline-flex rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
        Expiring{daysLeft !== null ? ` · ${daysLeft}d` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
      Expired{daysLeft !== null ? ` · ${Math.abs(daysLeft)}d ago` : ""}
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
