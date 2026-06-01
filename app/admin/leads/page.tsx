"use client";

// ============================================================
// /admin/leads — sales pipeline for prospects from IG, FB,
// WhatsApp, calls, referrals, etc. Manual entry + status board.
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

const ADMIN_EMAILS: string[] = [
  "info@aiagentforge.in",
  "info.agentforge@gmail.com",
];

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  city: string | null;
  source: string;
  source_detail: string | null;
  status: string;
  expected_revenue: number | null;
  next_action_at: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

const SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook",  label: "Facebook" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "google",    label: "Google" },
  { value: "call",      label: "Phone call" },
  { value: "referral",  label: "Referral" },
  { value: "website",   label: "Website" },
  { value: "event",     label: "Event" },
  { value: "other",     label: "Other" },
];

const STATUSES = [
  { value: "new",       label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "demo",      label: "Demo" },
  { value: "trial",     label: "Trial" },
  { value: "converted", label: "Converted ✓" },
  { value: "lost",      label: "Lost" },
];

const STATUS_STYLES: Record<string, string> = {
  new:       "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  contacted: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  qualified: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  demo:      "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
  trial:     "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  converted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  lost:      "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export default function AdminLeadsPage() {
  const { darkMode } = useTheme();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const isAdmin = authEmail
    ? ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(authEmail.toLowerCase())
    : false;

  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // New-lead form (inline)
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Partial<LeadRow>>({
    name: "",
    email: "",
    phone: "",
    business_name: "",
    city: "",
    source: "instagram",
    source_detail: "",
    status: "new",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setAuthEmail(data.session?.user?.email ?? null);
      setLoadingAuth(false);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, s) => setAuthEmail(s?.user?.email ?? null),
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingRows(true);
    (async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (!error && data) setRows(data as LeadRow[]);
      else if (error) console.error("[admin/leads] load failed:", error.message);
      setLoadingRows(false);
    })();
  }, [isAdmin, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const hay = `${r.name} ${r.email ?? ""} ${r.phone ?? ""} ${r.business_name ?? ""} ${r.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, sourceFilter, statusFilter, search]);

  // Funnel
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    return {
      total: rows.length,
      open: rows.filter((r) => !["converted", "lost"].includes(r.status)).length,
      converted: byStatus.converted ?? 0,
      lost: byStatus.lost ?? 0,
    };
  }, [rows]);

  async function saveLead() {
    if (!draft.name?.trim()) {
      alert("Name is required.");
      return;
    }
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const created_by = sess.session?.user?.id ?? null;
    const payload = {
      name: draft.name!.trim(),
      email: draft.email?.trim() || null,
      phone: draft.phone?.trim() || null,
      business_name: draft.business_name?.trim() || null,
      city: draft.city?.trim() || null,
      source: draft.source || "other",
      source_detail: draft.source_detail?.trim() || null,
      status: draft.status || "new",
      notes: draft.notes?.trim() || null,
      created_by,
    };
    const { error } = await supabase.from("leads").insert(payload);
    setSaving(false);
    if (error) {
      alert(`Could not save lead: ${error.message}`);
      return;
    }
    setShowForm(false);
    setDraft({
      name: "",
      email: "",
      phone: "",
      business_name: "",
      city: "",
      source: "instagram",
      source_detail: "",
      status: "new",
      notes: "",
    });
    setRefreshKey((k) => k + 1);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.06]"
    : "border-black/10 bg-white/85";
  const muted = darkMode ? "text-white/60" : "text-black/55";
  const inputCls =
    "w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-white";

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
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Leads</h1>
            <p className={`mt-1 text-sm ${muted}`}>
              Prospects from Instagram, Facebook, WhatsApp, calls, referrals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/customers"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${card}`}
            >
              ← Customers
            </Link>
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${card}`}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/30"
            >
              <Plus className="h-4 w-4" />
              {showForm ? "Close" : "New lead"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Stat label="Total"     value={stats.total}     card={card} muted={muted} />
          <Stat label="Open"      value={stats.open}      card={card} muted={muted} accent="text-cyan-600" />
          <Stat label="Converted" value={stats.converted} card={card} muted={muted} accent="text-emerald-600" />
          <Stat label="Lost"      value={stats.lost}      card={card} muted={muted} accent="text-rose-600" />
        </div>

        {/* Add form */}
        {showForm && (
          <div className={`mt-5 rounded-2xl border p-5 ${card}`}>
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
              New lead
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Name" required>
                <input
                  type="text"
                  value={draft.name ?? ""}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Bhavin Joshi"
                  className={inputCls}
                />
              </Field>
              <Field label="Business / shop name">
                <input
                  type="text"
                  value={draft.business_name ?? ""}
                  onChange={(e) => setDraft({ ...draft, business_name: e.target.value })}
                  placeholder="Shree Ganesh Textile"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={draft.phone ?? ""}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  placeholder="+91 98XXXXXXXX"
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={draft.email ?? ""}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="optional"
                  className={inputCls}
                />
              </Field>
              <Field label="City">
                <input
                  type="text"
                  value={draft.city ?? ""}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  placeholder="Bhiwandi"
                  className={inputCls}
                />
              </Field>
              <Field label="Source" required>
                <select
                  value={draft.source ?? "instagram"}
                  onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                  className={inputCls}
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Source detail" hint="campaign, referrer name, etc.">
                <input
                  type="text"
                  value={draft.source_detail ?? ""}
                  onChange={(e) => setDraft({ ...draft, source_detail: e.target.value })}
                  placeholder="FB ad: textile mockups"
                  className={inputCls}
                />
              </Field>
              <Field label="Status">
                <select
                  value={draft.status ?? "new"}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                  className={inputCls}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Notes" full>
                <textarea
                  rows={2}
                  value={draft.notes ?? ""}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="What they want, what they asked, next step…"
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={saveLead}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 text-sm font-black text-white shadow disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {saving ? "Saving…" : "Save lead"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`inline-flex rounded-full border px-4 py-2 text-sm font-bold ${card}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`mt-5 grid gap-3 rounded-2xl border p-3 sm:grid-cols-[1fr_auto_auto] sm:p-4 ${card}`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / phone / business / city…"
              className="w-full rounded-xl border border-black/10 bg-white/80 py-2.5 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-white/[0.06]"
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.06]"
          >
            <option value="all">All sources</option>
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.06]"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className={`mt-5 rounded-2xl border ${card}`}>
          {loadingRows ? (
            <p className={`p-8 text-center text-sm ${muted}`}>Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl">🎯</p>
              <p className={`mt-2 text-sm ${muted}`}>
                {rows.length === 0
                  ? "No leads yet. Click “New lead” to add one."
                  : "No leads match your filters."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip status={r.status} />
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] dark:bg-white/10">
                        {sourceLabel(r.source)}
                      </span>
                      <span className={`text-[11px] font-bold ${muted}`}>
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-black sm:text-base">
                      {r.name}
                      {r.business_name ? (
                        <span className={`ml-2 text-sm font-normal ${muted}`}>
                          · {r.business_name}
                        </span>
                      ) : null}
                    </p>
                    <p className={`mt-0.5 truncate text-xs ${muted}`}>
                      {r.phone ?? "—"}{r.email ? ` · ${r.email}` : ""}{r.city ? ` · ${r.city}` : ""}
                    </p>
                    {r.notes && (
                      <p className={`mt-1.5 line-clamp-2 text-xs ${muted}`}>{r.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="rounded-xl border border-black/10 bg-white/80 px-2 py-1 text-xs dark:border-white/10 dark:bg-white/[0.06]"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
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
// Helpers
// ────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  card,
  muted,
  accent,
}: {
  label: string;
  value: number;
  card: string;
  muted: string;
  accent?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${card}`}>
      <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${muted}`}>{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${accent ?? ""}`}>{value.toLocaleString("en-IN")}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  full,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 flex items-center gap-1 text-xs font-bold text-black/65 dark:text-white/65">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && (
          <span className="font-normal text-black/40 dark:text-white/40"> · {hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}

function StatusChip({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.new;
  const label = STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${cls}`}>
      {label}
    </span>
  );
}

function sourceLabel(src: string) {
  return SOURCES.find((s) => s.value === src)?.label ?? src;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
