"use client";

// ============================================================
// /admin/customers — list of every signed-up AgentForge user.
// Reads profiles (credits, plan) merged with auth.users (email,
// signup date). Detail view at /admin/customers/[id].
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import {
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  CreditCard,
} from "lucide-react";

// Mirrors the admin_users table in sql/posts.sql.
const ADMIN_EMAILS: string[] = [
  "info@aiagentforge.in",
  "info.agentforge@gmail.com",
];

type CustomerRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  credits: number;
  plan: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type PlanFilter = "all" | "Starter" | "Pro Creator" | "Empire" | "Free";

export default function AdminCustomersPage() {
  const { darkMode } = useTheme();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const isAdmin = authEmail
    ? ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(authEmail.toLowerCase())
    : false;

  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [search, setSearch] = useState("");

  // Auth bootstrap
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setAuthEmail(data.session?.user?.email ?? null);
      setLoadingAuth(false);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setAuthEmail(session?.user?.email ?? null),
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Load customers
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingRows(true);
    (async () => {
      // Pull from profiles. We rely on RLS having a policy that
      // lets admins read every profile (see sql/posts.sql).
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, credits, plan, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (!error && data) {
        setRows(data as CustomerRow[]);
      } else if (error) {
        console.error("[admin/customers] load failed:", error.message);
      }
      setLoadingRows(false);
    })();
  }, [isAdmin, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (planFilter !== "all") {
        const effectivePlan = r.plan ?? "Free";
        if (effectivePlan !== planFilter) return false;
      }
      if (q) {
        const hay = `${r.email ?? ""} ${r.full_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, planFilter, search]);

  // Quick stats
  const stats = useMemo(() => {
    const total = rows.length;
    const paying = rows.filter((r) => r.plan && r.plan !== "Free").length;
    const totalCredits = rows.reduce((a, r) => a + Number(r.credits || 0), 0);
    return { total, paying, totalCredits };
  }, [rows]);

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.06]"
    : "border-black/10 bg-white/85";
  const muted = darkMode ? "text-white/60" : "text-black/55";

  if (loadingAuth) {
    return (
      <main className={`flex min-h-screen items-center justify-center ${bg}`}>
        <p className={muted}>Checking access…</p>
      </main>
    );
  }

  if (!authEmail) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-6 ${bg}`}>
        <div className={`max-w-md rounded-3xl border p-8 text-center ${card}`}>
          <ShieldCheck className="mx-auto h-10 w-10 text-cyan-500" />
          <h1 className="mt-3 text-xl font-black">Admin login required</h1>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-6 ${bg}`}>
        <div className={`max-w-md rounded-3xl border p-8 text-center ${card}`}>
          <ShieldCheck className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-3 text-xl font-black">Access denied</h1>
          <p className={`mt-2 text-sm ${muted}`}>
            {authEmail} is not on the admin allowlist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative min-h-screen ${bg}`}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-600">
              Admin · CRM
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Customers</h1>
            <p className={`mt-1 text-sm ${muted}`}>
              Every signed-up AgentForge user — plan, credits, last active.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${card}`}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/30"
            >
              <Users className="h-4 w-4" />
              Leads →
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label="Total users"      value={stats.total.toLocaleString("en-IN")}      icon={<Users className="h-4 w-4" />} card={card} muted={muted} />
          <Stat label="Paying customers" value={stats.paying.toLocaleString("en-IN")}     icon={<CreditCard className="h-4 w-4" />} card={card} muted={muted} />
          <Stat label="Credits in wallet" value={stats.totalCredits.toLocaleString("en-IN")} icon={<CreditCard className="h-4 w-4" />} card={card} muted={muted} />
        </div>

        {/* Filters */}
        <div className={`mt-5 grid gap-3 rounded-2xl border p-3 sm:grid-cols-[1fr_auto] sm:p-4 ${card}`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or name…"
              className="w-full rounded-xl border border-black/10 bg-white/80 py-2.5 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-white/[0.06]"
            />
          </div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
            className="rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.06]"
          >
            <option value="all">All plans</option>
            <option value="Free">Free</option>
            <option value="Starter">Starter</option>
            <option value="Pro Creator">Pro Creator</option>
            <option value="Empire">Empire</option>
          </select>
        </div>

        {/* Table */}
        <div className={`mt-5 rounded-2xl border ${card}`}>
          {loadingRows ? (
            <p className={`p-8 text-center text-sm ${muted}`}>Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl">👤</p>
              <p className={`mt-2 text-sm ${muted}`}>
                {rows.length === 0
                  ? "No users signed up yet."
                  : "No users match your filters."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <PlanChip plan={r.plan} />
                      <span className={`text-[11px] font-bold ${muted}`}>
                        {r.created_at ? `Joined ${formatDate(r.created_at)}` : ""}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-black sm:text-base">
                      {r.full_name?.trim() || r.email || "—"}
                    </p>
                    <p className={`mt-0.5 truncate text-xs ${muted}`}>
                      {r.email ?? "(no email)"} · last active{" "}
                      {r.updated_at ? formatDate(r.updated_at) : "never"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-base font-black tabular-nums">
                        {Number(r.credits).toLocaleString("en-IN")}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${muted}`}>
                        credits
                      </p>
                    </div>
                    <Link
                      href={`/admin/customers/${r.id}`}
                      className="inline-flex h-9 items-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-3 text-xs font-black text-white shadow"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className={`mt-6 text-center text-xs ${muted}`}>
          Signed in as <span className="font-black">{authEmail}</span>
        </p>
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────────
// Small primitives
// ────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  icon,
  card,
  muted,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  card: string;
  muted: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${card}`}>
      <div className={`flex items-center gap-2 ${muted}`}>
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

const PLAN_STYLES: Record<string, string> = {
  Empire:
    "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "Pro Creator":
    "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  Starter:
    "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  Free:
    "bg-black/5 text-black/55 dark:bg-white/10 dark:text-white/55",
};

function PlanChip({ plan }: { plan: string | null }) {
  const effective = plan ?? "Free";
  const cls = PLAN_STYLES[effective] ?? PLAN_STYLES.Free;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${cls}`}>
      {effective}
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
