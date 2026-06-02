"use client";

// ============================================================
// /admin/leads — corporate sales pipeline.
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronRight,
  Download,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { buildCsv, downloadCsv } from "@/lib/csv";
import LeadsCsvImportModal from "./LeadsCsvImportModal";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
  adminSecondaryBtnCls,
} from "../AdminShell";

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
  notes: string | null;
  tags: string[];
  created_at: string;
};

const SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook",  label: "Facebook" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "google",    label: "Google" },
  { value: "call",      label: "Phone" },
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
  { value: "converted", label: "Converted" },
  { value: "lost",      label: "Lost" },
];

const STATUS_STYLES: Record<string, string> = {
  new:       "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  contacted: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  qualified: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  demo:      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  trial:     "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  converted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  lost:      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function AdminLeadsPage() {
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

  // Auto-opens when ?new=1 is in the URL — drives the AdminShell
  // "+ New lead" quick button. We read window.location directly
  // (instead of useSearchParams) to avoid Next.js 16's Suspense
  // boundary requirement during static prerender.
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") setShowForm(true);
  }, []);

  // Bulk-import + export modal state
  const [showImport, setShowImport] = useState(false);

  function exportFilteredAsCsv() {
    const headers = [
      "created_at",
      "name",
      "phone",
      "email",
      "business_name",
      "city",
      "source",
      "source_detail",
      "status",
      "notes",
    ];
    const rows = filtered.map((r) => [
      r.created_at,
      r.name,
      r.phone,
      r.email,
      r.business_name,
      r.city,
      r.source,
      r.source_detail,
      r.status,
      r.notes,
    ]);
    const csv = buildCsv(headers, rows);
    const ts = new Date().toISOString().slice(0, 10);
    downloadCsv(`agentforge-leads-${ts}.csv`, csv);
  }
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

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    return {
      total: rows.length,
      open: rows.filter((r) => !["converted", "lost"].includes(r.status)).length,
      converted: byStatus.converted ?? 0,
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

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }
  if (!authEmail || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      breadcrumbs={[{ label: "Leads" }]}
      title="Leads"
      subtitle={`${stats.total} total · ${stats.open} open · ${stats.converted} converted`}
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
            onClick={() => setShowImport(true)}
            className={adminSecondaryBtnCls}
            title="Import leads from a CSV (Meta Ads, Google Ads, Excel)"
          >
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={exportFilteredAsCsv}
            disabled={filtered.length === 0}
            className={adminSecondaryBtnCls}
            title="Download the filtered leads as a CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className={adminPrimaryBtnCls}
          >
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? "Close" : "New lead"}
          </button>
        </>
      }
    >
      {/* Add form */}
      {showForm && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            New lead
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Labeled label="Name" required>
              <input
                type="text"
                value={draft.name ?? ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={adminInputCls}
              />
            </Labeled>
            <Labeled label="Business name">
              <input
                type="text"
                value={draft.business_name ?? ""}
                onChange={(e) => setDraft({ ...draft, business_name: e.target.value })}
                className={adminInputCls}
              />
            </Labeled>
            <Labeled label="Phone">
              <input
                type="tel"
                value={draft.phone ?? ""}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className={adminInputCls}
              />
            </Labeled>
            <Labeled label="Email">
              <input
                type="email"
                value={draft.email ?? ""}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className={adminInputCls}
              />
            </Labeled>
            <Labeled label="City">
              <input
                type="text"
                value={draft.city ?? ""}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                className={adminInputCls}
              />
            </Labeled>
            <Labeled label="Source">
              <select
                value={draft.source ?? "instagram"}
                onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                className={adminInputCls}
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Source detail">
              <input
                type="text"
                value={draft.source_detail ?? ""}
                onChange={(e) => setDraft({ ...draft, source_detail: e.target.value })}
                placeholder="campaign, referrer, etc."
                className={adminInputCls}
              />
            </Labeled>
            <Labeled label="Status">
              <select
                value={draft.status ?? "new"}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                className={adminInputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Notes" full>
              <textarea
                rows={2}
                value={draft.notes ?? ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                className={adminInputCls}
              />
            </Labeled>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={adminSecondaryBtnCls}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveLead}
              disabled={saving}
              className={adminPrimaryBtnCls}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save lead"}
            </button>
          </div>
        </section>
      )}

      {/* Filters */}
      <div className={`${adminCardCls} flex flex-col gap-2 p-3 sm:flex-row`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, business or city"
            className={`${adminInputCls} pl-9`}
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className={`${adminInputCls} sm:max-w-[160px]`}
        >
          <option value="all">All sources</option>
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${adminInputCls} sm:max-w-[160px]`}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
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
              ? "No leads recorded yet. Use “New lead” to add one."
              : "No leads match the current filter."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <Link
                  href={`/admin/leads/${r.id}`}
                  className="min-w-0 flex-1 group"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={r.status} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {sourceLabel(r.source)}
                    </span>
                    <span className={`text-[11px] ${adminMutedCls}`}>
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                    {r.name}
                    {r.business_name && (
                      <span className={`ml-2 text-xs font-normal ${adminMutedCls}`}>
                        · {r.business_name}
                      </span>
                    )}
                  </p>
                  <p className={`mt-0.5 truncate text-xs ${adminMutedCls}`}>
                    {[r.phone, r.email, r.city].filter(Boolean).join(" · ") || "—"}
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                    className={`${adminInputCls} sm:max-w-[160px]`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <Link
                    href={`/admin/leads/${r.id}`}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bulk CSV import modal — opens via the toolbar button */}
      <LeadsCsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => setRefreshKey((k) => k + 1)}
      />
    </AdminShell>
  );
}

function Labeled({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function StatusChip({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.new;
  const label = STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${cls}`}>
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
