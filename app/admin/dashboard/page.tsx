"use client";

// ============================================================
// /admin/dashboard — Founder War Room.
// ============================================================
// One-trip read of public.dashboard_metrics() into a single JSON
// blob. Page renders six panels:
//   • Hero stats        — revenue today/yesterday/week/month + counts
//   • 30-day revenue    — minimal SVG sparkline
//   • Pipeline + tasks  — open leads, hot leads, open tasks, overdue
//   • Subscriptions     — active / expiring 7d / expired
//   • Plan + sources    — distribution lists
//   • Alerts            — what needs attention right now
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CreditCard,
  DollarSign,
  Flame,
  Gem,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Ticket,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { GradientStat } from "../StatCards";

type Metrics = {
  revenue: {
    today: number;
    yesterday: number;
    this_week: number;
    this_month: number;
    lifetime: number;
  };
  counts: {
    signups_today: number;
    signups_week: number;
    new_payers_today: number;
    paying_customers: number;
    active_subs: number;
    expiring_7d: number;
    expired_subs: number;
    open_leads: number;
    hot_leads: number;
    open_tasks: number;
    my_open_tasks: number;
    overdue_tasks: number;
  };
  credits: { used_today: number; used_week: number; used_month: number };
  ai: { gens_today: number; gens_month: number; failed_today: number; queued_now: number };
  finance: { revenue_month: number; expenses_month: number; net_profit_month: number };
  support: { open_tickets: number; urgent_tickets: number };
  plans: { plan: string; count: number }[];
  lead_sources: { source: string; count: number }[];
  daily_revenue: { d: string; amount: number }[];
  health?: { status: string; count: number }[];
  alerts: {
    kind: string;
    severity: "critical" | "warning" | "info";
    message: string;
    target: string;
  }[];
};

export default function AdminDashboardPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("dashboard.view");

  const [data, setData]             = useState<Metrics | null>(null);
  const [insights, setInsights]     = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    setLoadingData(true);
    setError(null);
    (async () => {
      const [{ data: m, error: e }, { data: ins }] = await Promise.all([
        supabase.rpc("dashboard_metrics", { p_actor_email: email ?? null }),
        supabase.rpc("ai_business_insights"),
      ]);
      if (e) { setError(e.message); setData(null); }
      else { setData(m as Metrics); }
      setInsights((ins as any)?.insights ?? []);
      setLoadingData(false);
    })();
  }, [canView, refreshKey, email]);

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
            Your role does not include the <code>dashboard.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  return (
    <AdminShell
      doodleType="dashboard"
      breadcrumbs={[{ label: "Dashboard" }]}
      title="War Room"
      subtitle={todayLabel}
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
      {loadingData ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : error ? (
        <div className={`${adminCardCls} p-6 text-center`}>
          <p className="text-sm font-bold text-rose-600">{error}</p>
        </div>
      ) : !data ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>
          No metrics returned.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Today's Scoreboard — gradient KPI cards */}
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Today's Scoreboard
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              <GradientStat label="Revenue" value={`₹${data.revenue.today.toLocaleString("en-IN")}`} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
              <GradientStat label="New Leads" value={data.counts.open_leads} gradient="bg-gradient-to-br from-sky-500 to-blue-600" />
              <GradientStat label="New Signups" value={data.counts.signups_today} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
              <GradientStat label="Paid Customers" value={data.counts.new_payers_today} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
              <GradientStat label="Credits Used" value={data.credits.used_today.toLocaleString("en-IN")} gradient="bg-gradient-to-br from-purple-500 to-fuchsia-600" />
              <GradientStat label="AI Generations" value={data.ai?.gens_today ?? 0} gradient="bg-gradient-to-br from-fuchsia-500 to-pink-600" />
              <GradientStat
                label="Net Profit"
                value={`₹${(data.finance?.net_profit_month ?? 0).toLocaleString("en-IN")}`}
                gradient={(data.finance?.net_profit_month ?? 0) >= 0 ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-gradient-to-br from-rose-500 to-red-600"}
              />
            </div>
          </section>

          {/* Alerts strip */}
          {data.alerts.length > 0 && (
            <section className="grid gap-2 sm:grid-cols-2">
              {data.alerts.map((a, i) => (
                <Link
                  key={i}
                  href={a.target}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-sm transition ${
                    a.severity === "critical"
                      ? "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-200"
                      : a.severity === "warning"
                        ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-500/10 dark:text-amber-200"
                        : "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-700/40 dark:bg-sky-500/10 dark:text-sky-200"
                  }`}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="flex-1">{a.message}</span>
                </Link>
              ))}
            </section>
          )}

          {/* Hero — Revenue + Today's signal */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <BigStat
              label="Revenue today"
              value={`₹${data.revenue.today.toLocaleString("en-IN")}`}
              delta={trendLabel(data.revenue.today, data.revenue.yesterday)}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="emerald"
            />
            <BigStat
              label="Revenue this month"
              value={`₹${data.revenue.this_month.toLocaleString("en-IN")}`}
              sub={`This week: ₹${data.revenue.this_week.toLocaleString("en-IN")}`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <BigStat
              label="New signups today"
              value={data.counts.signups_today}
              sub={`This week: ${data.counts.signups_week}`}
              icon={<UserPlus className="h-4 w-4" />}
            />
            <BigStat
              label="New paying customers today"
              value={data.counts.new_payers_today}
              sub={`Total paying: ${data.counts.paying_customers}`}
              icon={<CreditCard className="h-4 w-4" />}
              tone={data.counts.new_payers_today > 0 ? "emerald" : undefined}
            />
          </section>

          {/* Daily revenue sparkline */}
          <section className={`${adminCardCls} p-4`}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Daily revenue · last 30 days
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums">
                  ₹{data.revenue.lifetime.toLocaleString("en-IN")}{" "}
                  <span className={`text-xs font-medium ${adminMutedCls}`}>
                    lifetime
                  </span>
                </p>
              </div>
              <p className={`text-[11px] ${adminMutedCls}`}>
                Hover bars for daily ₹
              </p>
            </div>
            <Sparkbars points={data.daily_revenue} />
          </section>

          {/* Pipeline + Tasks + Subs row */}
          <section className="grid gap-3 lg:grid-cols-3">
            <Group title="Pipeline" href="/admin/leads">
              <Line label="Open leads"  value={data.counts.open_leads}  tone="sky" />
              <Line label="Hot leads"   value={data.counts.hot_leads}   icon={<Flame className="h-3 w-3" />} tone="amber" />
            </Group>
            <Group title="Tasks" href="/admin/tasks">
              <Line label="Open"          value={data.counts.open_tasks} />
              <Line label="My open"       value={data.counts.my_open_tasks} tone="indigo" icon={<ListChecks className="h-3 w-3" />} />
              <Line label="Overdue"       value={data.counts.overdue_tasks} tone={data.counts.overdue_tasks > 0 ? "rose" : undefined} />
            </Group>
            <Group title="Subscriptions" href="/admin/subscriptions">
              <Line label="Active"        value={data.counts.active_subs}  tone="emerald" />
              <Line label="Expiring 7d"   value={data.counts.expiring_7d}  tone={data.counts.expiring_7d > 0 ? "amber" : undefined} icon={<CalendarClock className="h-3 w-3" />} />
              <Line label="Expired"       value={data.counts.expired_subs} tone={data.counts.expired_subs > 0 ? "rose" : undefined} />
            </Group>
          </section>

          {/* AI + Finance + Support row */}
          <section className="grid gap-3 lg:grid-cols-3">
            <Group title="AI Operations" href="/admin/ai-operations">
              <Line label="Generations today" value={data.ai?.gens_today ?? 0} tone="indigo" icon={<Zap className="h-3 w-3" />} />
              <Line label="This month"        value={data.ai?.gens_month ?? 0} />
              <Line label="Failed today"      value={data.ai?.failed_today ?? 0} tone={( data.ai?.failed_today ?? 0) > 0 ? "rose" : undefined} />
              <Line label="Queue"             value={data.ai?.queued_now ?? 0}   tone={(data.ai?.queued_now ?? 0) > 5 ? "amber" : undefined} />
            </Group>
            <Group title="Finance" href="/admin/finance">
              <Line label="Revenue month"  value={data.finance?.revenue_month ?? 0}   tone="emerald" icon={<DollarSign className="h-3 w-3" />} format="inr" />
              <Line label="Expenses month" value={data.finance?.expenses_month ?? 0}  tone="rose"    format="inr" />
              <Line label="Net profit"     value={data.finance?.net_profit_month ?? 0} tone={(data.finance?.net_profit_month ?? 0) >= 0 ? "emerald" : "rose"} format="inr" />
            </Group>
            <Group title="Support" href="/admin/support-center">
              <Line label="Open tickets"   value={data.support?.open_tickets ?? 0}  tone={(data.support?.open_tickets ?? 0) > 0 ? "amber" : undefined} icon={<Ticket className="h-3 w-3" />} />
              <Line label="Urgent"         value={data.support?.urgent_tickets ?? 0} tone={(data.support?.urgent_tickets ?? 0) > 0 ? "rose" : undefined} />
              <Line label="Credits used today" value={data.credits.used_today} icon={<Gem className="h-3 w-3" />} />
            </Group>
          </section>

          {/* Customer health distribution */}
          {data.health && data.health.length > 0 && (
            <section className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Customer health
              </p>
              <HealthDistribution items={data.health} />
            </section>
          )}

          {/* Distribution row */}
          <section className="grid gap-3 lg:grid-cols-3">
            {/* Plan distribution */}
            <div className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Plan distribution
              </p>
              <DistributionBars
                items={data.plans.map((p) => ({
                  label: p.plan,
                  value: p.count,
                }))}
              />
            </div>

            {/* Lead source breakdown */}
            <div className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Lead sources
              </p>
              <DistributionBars
                items={data.lead_sources.map((s) => ({
                  label: s.source,
                  value: s.count,
                }))}
              />
            </div>

            {/* Credit usage */}
            <div className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Credit consumption
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <Mini label="Today" value={data.credits.used_today.toLocaleString("en-IN")} />
                <Mini label="Week"  value={data.credits.used_week.toLocaleString("en-IN")} />
                <Mini label="Month" value={data.credits.used_month.toLocaleString("en-IN")} />
              </dl>
              <p className={`mt-3 text-[11px] ${adminMutedCls}`}>
                Each credit is one image generation request. Use this to
                estimate API costs.
              </p>
            </div>
          </section>

          {/* AI Business Intelligence */}
          {insights.length > 0 && (
            <section className={adminCardCls}>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  ðŸ¤– AI Business Intelligence
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {insights.length} insight{insights.length > 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {insights.map((ins: any, i: number) => (
                  <Link key={i} href={ins.target ?? "#"} className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <span className="mt-0.5 text-lg">{ins.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold ${
                        ins.severity === "critical" ? "text-rose-700 dark:text-rose-300" :
                        ins.severity === "warning"  ? "text-amber-700 dark:text-amber-300" :
                        ins.severity === "success"  ? "text-emerald-700 dark:text-emerald-300" :
                        "text-slate-700 dark:text-slate-200"
                      }`}>{ins.title}</p>
                      <p className={`text-xs ${adminMutedCls}`}>{ins.body}</p>
                    </div>
                    <span className={`mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      ins.severity === "critical" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" :
                      ins.severity === "warning"  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" :
                      ins.severity === "success"  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" :
                      "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                    }`}>{ins.severity}</span>
                  </Link>
                ))}
              </ul>
            </section>
          )}

          {/* Quick actions row */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Quick actions
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <QuickLink href="/admin/leads?new=1" label="Add lead" />
              <QuickLink href="/admin/sales" label="Sales Command" />
              <QuickLink href="/admin/tasks" label="View tasks" />
              <QuickLink href="/admin/subscriptions?view=expiring" label="Expiring subs" />
              <QuickLink href="/admin/invoices" label="Invoices" />
              <QuickLink href="/admin/customers" label="Customers" />
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

// ────────────────────────────────────────────────────────────
// Presentational atoms
// ────────────────────────────────────────────────────────────

function BigStat({
  label,
  value,
  sub,
  delta,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: string;
  icon?: React.ReactNode;
  tone?: "emerald" | "rose";
}) {
  const accent =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "rose"
        ? "text-rose-600 dark:text-rose-300"
        : "text-slate-700 dark:text-slate-200";
  return (
    <div className={`${adminCardCls} p-4`}>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${accent}`}>
        {value}
      </p>
      {(sub || delta) && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {delta && (
            <span
              className={
                delta.startsWith("+")
                  ? "font-bold text-emerald-600 dark:text-emerald-300"
                  : delta.startsWith("-")
                    ? "font-bold text-rose-600 dark:text-rose-300"
                    : ""
              }
            >
              {delta}
            </span>
          )}
          {delta && sub && " · "}
          {sub}
        </p>
      )}
    </div>
  );
}

function Group({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${adminCardCls} group block p-4 transition hover:border-slate-300 dark:hover:border-slate-700`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">{children}</ul>
    </Link>
  );
}

function Line({
  label,
  value,
  icon,
  tone,
  format,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: "emerald" | "rose" | "amber" | "sky" | "indigo";
  format?: "inr";
}) {
  const t =
    tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" :
    tone === "rose"    ? "text-rose-600 dark:text-rose-300" :
    tone === "amber"   ? "text-amber-600 dark:text-amber-300" :
    tone === "sky"     ? "text-sky-600 dark:text-sky-300" :
    tone === "indigo"  ? "text-indigo-600 dark:text-indigo-300" :
                         "text-slate-700 dark:text-slate-200";
  const display = format === "inr"
    ? `₹${Math.abs(value).toLocaleString("en-IN")}`
    : value.toLocaleString("en-IN");
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
        {icon}
        {label}
      </span>
      <span className={`tabular-nums font-bold ${t}`}>
        {display}
      </span>
    </li>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-base font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function DistributionBars({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0)
    return (
      <p className={`mt-3 text-xs ${adminMutedCls}`}>No data yet.</p>
    );
  return (
    <ul className="mt-3 space-y-2">
      {items.map((it) => {
        const w = Math.round((it.value / max) * 100);
        return (
          <li key={it.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium capitalize">{it.label}</span>
              <span className="tabular-nums font-bold">
                {it.value.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-900 dark:from-indigo-500 dark:to-indigo-700"
                style={{ width: `${w}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const HEALTH_TONES: Record<string, string> = {
  healthy:    "bg-emerald-500",
  active:     "bg-sky-500",
  at_risk:    "bg-amber-500",
  churn_risk: "bg-rose-500",
  churned:    "bg-slate-400",
};

const HEALTH_LABELS_DASH: Record<string, string> = {
  healthy:    "Healthy",
  active:     "Active",
  at_risk:    "At risk",
  churn_risk: "Churn risk",
  churned:    "Churned",
};

function HealthDistribution({
  items,
}: {
  items: { status: string; count: number }[];
}) {
  const total = items.reduce((a, x) => a + x.count, 0);
  if (total === 0) {
    return (
      <p className={`mt-3 text-xs ${adminMutedCls}`}>
        No customer health data yet.
      </p>
    );
  }
  const ordered = ["healthy", "active", "at_risk", "churn_risk", "churned"]
    .map((s) => items.find((i) => i.status === s))
    .filter((x): x is { status: string; count: number } => Boolean(x));

  return (
    <div className="mt-3">
      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {ordered.map((it) => {
          const w = (it.count / total) * 100;
          return (
            <div
              key={it.status}
              title={`${HEALTH_LABELS_DASH[it.status] ?? it.status}: ${it.count}`}
              className={HEALTH_TONES[it.status] ?? "bg-slate-300"}
              style={{ width: `${w}%` }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <ul className="mt-3 grid gap-2 sm:grid-cols-5">
        {ordered.map((it) => (
          <li key={it.status} className="flex items-center gap-2 text-xs">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${HEALTH_TONES[it.status] ?? "bg-slate-300"}`}
            />
            <Link
              href={`/admin/customers?health=${it.status}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-300"
            >
              <span className="font-bold">
                {HEALTH_LABELS_DASH[it.status] ?? it.status}
              </span>{" "}
              <span className={`tabular-nums ${adminMutedCls}`}>{it.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Sparkbars({
  points,
}: {
  points: { d: string; amount: number }[];
}) {
  const max = Math.max(1, ...points.map((p) => p.amount));
  return (
    <div className="mt-4 flex h-24 items-end gap-1">
      {points.map((p, i) => {
        const h = Math.max(2, Math.round((p.amount / max) * 100));
        return (
          <div
            key={i}
            title={`${p.d}: ₹${p.amount.toLocaleString("en-IN")}`}
            className="group flex-1 rounded-t bg-slate-200 transition hover:bg-indigo-500 dark:bg-slate-700"
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
    >
      {label}
    </Link>
  );
}

function trendLabel(now: number, prev: number): string {
  if (prev === 0 && now === 0) return "no change vs yesterday";
  if (prev === 0) return `+${now.toLocaleString("en-IN")} vs yesterday`;
  const diff = Math.round(((now - prev) / prev) * 100);
  if (diff > 0) return `+${diff}% vs yesterday`;
  if (diff < 0) return `${diff}% vs yesterday`;
  return "flat vs yesterday";
}

