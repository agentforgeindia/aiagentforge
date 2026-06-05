"use client";

// ============================================================
// /admin/leads â€” corporate sales pipeline.
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronRight,
  Download,
  Kanban,
  List,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { buildCsv, downloadCsv } from "@/lib/csv";
import LeadsCsvImportModal from "./LeadsCsvImportModal";
import PipelineView from "./PipelineView";
import { useAdminPermissions } from "../AdminPermissions";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
  adminSecondaryBtnCls,
} from "../AdminShell";

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
  score: number;
  score_reasons: string[];
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

// Coarser pipeline "stages" surfaced as quick-filter pills above
// the table. Each pill maps to one or more raw statuses so that
// the sales team can slice by intent without thinking about every
// granular status name.
type StageId = "all" | "not_connected" | "connected" | "hot" | "won" | "lost";
const STAGES: { value: StageId; label: string; statuses: string[] }[] = [
  { value: "all",           label: "All",           statuses: [] }, // [] = no filter
  { value: "not_connected", label: "Not connected", statuses: ["new"] },
  { value: "connected",     label: "Connected",     statuses: ["contacted", "qualified"] },
  { value: "hot",           label: "Hot",           statuses: ["demo", "trial"] },
  { value: "won",           label: "Won",           statuses: ["converted"] },
  { value: "lost",          label: "Lost",          statuses: ["lost"] },
];

function matchesStage(stage: StageId, leadStatus: string): boolean {
  const s = STAGES.find((x) => x.value === stage);
  if (!s || s.statuses.length === 0) return true;
  return s.statuses.includes(leadStatus);
}

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
  // Single source of truth â€” RBAC hook checks the DB-driven role +
  // permission list. No more hard-coded email allowlist (which used
  // to block every non-founder, including the new sales role).
  const {
    loading: loadingAuth,
    isAdmin,
    email: authEmail,
    has,
  } = useAdminPermissions();
  const canViewLeads = has("leads.view");
  const canDelete = has("leads.delete");
  const canAddLead = has("leads.add");

  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Quick stage pill (groups statuses into intuitive buckets).
  const [stageFilter, setStageFilter] = useState<StageId>("all");
  const [search, setSearch] = useState("");

  // Top-level view tabs â€” "Pipeline" (the leads table itself) vs
  // "Free signups" (virtual leads pulled from profiles).
  const [topView, setTopView] = useState<"pipeline" | "signups">("pipeline");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Bulk-action multi-select state. Each entry is a lead id.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [signupRows, setSignupRows] = useState<{
    id: string;
    email: string | null;
    full_name: string | null;
    created_at: string;
    credits: number;
    utm_source: string | null;
    utm_campaign: string | null;
    utm_medium: string | null;
    has_phone: boolean;
    last_activity_at: string | null;
  }[]>([]);
  const [loadingSignups, setLoadingSignups] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Auto-opens when ?new=1 is in the URL â€” drives the AdminShell
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

  // Note: session + email tracking now comes from useAdminPermissions
  // (it owns the supabase.auth.onAuthStateChange listener for the
  // entire admin shell), so we don't duplicate that here.

  useEffect(() => {
    if (!canViewLeads) return;
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
  }, [canViewLeads, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!matchesStage(stageFilter, r.status)) return false;
      if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const hay = `${r.name} ${r.email ?? ""} ${r.phone ?? ""} ${r.business_name ?? ""} ${r.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, stageFilter, sourceFilter, statusFilter, search]);

  // Per-stage counts shown in the pill badges. Always counts the
  // base `rows` (not filtered) so the pill always shows the total
  // for that bucket regardless of current source/search filter.
  const stageCounts = useMemo(() => {
    const out: Record<StageId, number> = {
      all: rows.length,
      not_connected: 0,
      connected: 0,
      hot: 0,
      won: 0,
      lost: 0,
    };
    for (const r of rows) {
      for (const s of STAGES) {
        if (s.value === "all") continue;
        if (s.statuses.includes(r.status)) {
          out[s.value]++;
          break;
        }
      }
    }
    return out;
  }, [rows]);

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

  // Load Free signups when that tab is activated or refresh fires.
  useEffect(() => {
    if (!canViewLeads || topView !== "signups") return;
    setLoadingSignups(true);
    (async () => {
      const { data, error } = await supabase.rpc("free_signups", {
        p_limit: 200,
        p_days: 90,
      });
      if (!error && Array.isArray(data)) {
        setSignupRows(data as typeof signupRows);
      }
      setLoadingSignups(false);
    })();
  }, [canViewLeads, topView, refreshKey]);

  async function convertSignup(s: typeof signupRows[number]) {
    if (!s.email) {
      alert("This signup has no email â€” cannot promote.");
      return;
    }
    if (!confirm(`Promote ${s.full_name?.trim() || s.email} to a sales lead?`)) {
      return;
    }
    setConvertingId(s.id);
    const { data: sess } = await supabase.auth.getSession();
    const created_by = sess.session?.user?.id ?? null;
    const payload = {
      name: s.full_name?.trim() || s.email,
      email: s.email,
      source: s.utm_source || "website",
      source_detail: s.utm_campaign
        ? `campaign:${s.utm_campaign}`
        : "Promoted from free signup",
      status: "new",
      notes: "Promoted from free signup.",
      converted_user_id: s.id,
      utm_source: s.utm_source ?? null,
      utm_medium: s.utm_medium ?? null,
      utm_campaign: s.utm_campaign ?? null,
      created_by,
    };
    const { error } = await supabase.from("leads").insert(payload);
    setConvertingId(null);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: "leads.add",
      p_target_type: "lead",
      p_target_id: s.id,
      p_details: { source: "convert_free_signup" },
    });
    setRefreshKey((k) => k + 1);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAllFiltered() {
    setSelected(new Set(filtered.map((r) => r.id)));
  }
  function clearSelection() {
    setSelected(new Set());
  }

  async function bulkSetStatus() {
    if (!bulkStatus || selected.size === 0) return;
    const ids = Array.from(selected);
    if (!confirm(`Update ${ids.length} lead(s) to "${bulkStatus}"?`)) return;
    const { error } = await supabase
      .from("leads")
      .update({ status: bulkStatus })
      .in("id", ids);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: "leads.bulk_status",
      p_target_type: "leads",
      p_target_id: null,
      p_details: { count: ids.length, new_status: bulkStatus },
    });
    clearSelection();
    setBulkStatus("");
    setRefreshKey((k) => k + 1);
  }

  async function bulkDelete() {
    if (!canDelete) return;
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    if (
      !confirm(
        `Permanently delete ${ids.length} lead(s) and their activity log? There is no undo.`,
      )
    )
      return;
    const { error } = await supabase.from("leads").delete().in("id", ids);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: "leads.bulk_delete",
      p_target_type: "leads",
      p_target_id: null,
      p_details: { count: ids.length },
    });
    clearSelection();
    setRefreshKey((k) => k + 1);
  }

  async function deleteLead(id: string, name: string) {
    const ok = confirm(
      `Delete "${name}"? This removes the lead row and its activity log permanently â€” there is no undo.`,
    );
    if (!ok) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    // Audit it so the founder can trace deletes.
    await supabase.rpc("log_admin_action", {
      p_action: "leads.delete",
      p_target_type: "lead",
      p_target_id: id,
      p_details: { name },
    });
    setRefreshKey((k) => k + 1);
  }

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking accessâ€¦
      </main>
    );
  }
  if (!authEmail || !isAdmin || !canViewLeads) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>leads.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="leads"
      breadcrumbs={[{ label: "Leads" }]}
      title="Leads"
      subtitle={`${stats.total} total Â· ${stats.open} open Â· ${stats.converted} converted`}
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
          <div className="flex rounded-md border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-l-md transition ${viewMode === "table" ? "bg-slate-900 text-white dark:bg-indigo-600" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-r-md transition ${viewMode === "kanban" ? "bg-slate-900 text-white dark:bg-indigo-600" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <Kanban className="h-3.5 w-3.5" />
              Pipeline
            </button>
          </div>
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
              {saving ? "Savingâ€¦" : "Save lead"}
            </button>
          </div>
        </section>
      )}

      {/* Kanban Pipeline View */}
      {viewMode === "kanban" && topView === "pipeline" && (
        <div className="mb-4">
          <PipelineView
            leads={rows}
            canManage={has("leads.add")}
            onStatusChange={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      )}

      {/* Top tabs â€” Pipeline (regular leads) vs Free signups */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setTopView("pipeline")}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
            topView === "pipeline"
              ? "bg-slate-900 text-white dark:bg-indigo-600"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          Pipeline
          <span className={`rounded px-1 text-[10px] tabular-nums ${
            topView === "pipeline" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
          }`}>
            {rows.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTopView("signups")}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
            topView === "signups"
              ? "bg-slate-900 text-white dark:bg-indigo-600"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          Free signups
          {signupRows.length > 0 && (
            <span className={`rounded px-1 text-[10px] tabular-nums ${
              topView === "signups" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
            }`}>
              {signupRows.length}
            </span>
          )}
        </button>
      </div>

      {/* Free-signups view â€” virtual leads pulled from profiles */}
      {topView === "signups" && (
        <div className={`${adminCardCls}`}>
          {loadingSignups ? (
            <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loadingâ€¦</p>
          ) : signupRows.length === 0 ? (
            <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
              No free-tier signups in the last 90 days that aren't already
              in the pipeline. Nice â€” your sales follow-up is up to date.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {signupRows.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                        Free signup
                      </span>
                      {s.has_phone && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                          Phone shared Â· warm
                        </span>
                      )}
                      {s.last_activity_at && (
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Generated content
                        </span>
                      )}
                      <span className={`text-[11px] ${adminMutedCls}`}>
                        {formatDate(s.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-bold">
                      {s.full_name?.trim() || s.email}
                    </p>
                    <p className={`mt-0.5 truncate text-xs ${adminMutedCls}`}>
                      {s.email}
                      {s.utm_source && ` Â· via ${s.utm_source}`}
                      {s.utm_campaign && ` / ${s.utm_campaign}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canAddLead && (
                      <button
                        type="button"
                        onClick={() => convertSignup(s)}
                        disabled={convertingId === s.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {convertingId === s.id ? "Promotingâ€¦" : "Convert"}
                      </button>
                    )}
                    <Link
                      href={`/admin/customers/${s.id}`}
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
      )}

      {/* Stage filter pills â€” quick slice by sales-intent bucket */}
      {topView === "pipeline" && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {STAGES.map((s) => {
            const active = stageFilter === s.value;
            const count = stageCounts[s.value];
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setStageFilter(s.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white dark:border-indigo-500 dark:bg-indigo-600"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
                }`}
              >
                {s.label}
                <span
                  className={`min-w-[20px] rounded-full px-1.5 text-[10px] tabular-nums ${
                    active
                      ? "bg-white/20"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      {topView === "pipeline" && (
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
      )}

      {/* Bulk action bar â€” appears only when rows are selected */}
      {topView === "pipeline" && selected.size > 0 && (
        <div className={`${adminCardCls} mt-4 flex flex-wrap items-center gap-2 p-3`}>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {selected.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className={`${adminInputCls} sm:max-w-[180px]`}
          >
            <option value="">Set status toâ€¦</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={bulkSetStatus}
            disabled={!bulkStatus}
            className={adminPrimaryBtnCls}
          >
            Apply
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={bulkDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-700/40 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={clearSelection}
            className={adminSecondaryBtnCls}
          >
            Clear
          </button>
        </div>
      )}

      {/* List â€” only shown on the Pipeline tab */}
      {topView === "pipeline" && (
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loadingâ€¦</p>
        ) : filtered.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            {rows.length === 0
              ? "No leads recorded yet. Use â€œNew leadâ€ to add one."
              : "No leads match the current filter."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.length > 0 && (
              <li className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/40">
                <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={
                      selected.size > 0 &&
                      filtered.every((r) => selected.has(r.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) selectAllFiltered();
                      else clearSelection();
                    }}
                    className="h-3.5 w-3.5"
                  />
                  Select all {filtered.length} in view
                </label>
              </li>
            )}
            {filtered.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggleSelect(r.id)}
                  className="mt-1 h-3.5 w-3.5 shrink-0 sm:mt-0"
                  onClick={(e) => e.stopPropagation()}
                />
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
                        Â· {r.business_name}
                      </span>
                    )}
                  </p>
                  <p className={`mt-0.5 truncate text-xs ${adminMutedCls}`}>
                    {[r.phone, r.email, r.city].filter(Boolean).join(" Â· ") || "â€”"}
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
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => deleteLead(r.id, r.name)}
                      title="Delete lead"
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
      )}

      {/* Bulk CSV import modal â€” opens via the toolbar button */}
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

