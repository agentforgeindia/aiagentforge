"use client";

// /admin/recruitment/candidates — Hiring OS candidate pipeline (non-influencer roles only).
// Content-creator / influencer applications are managed separately at /admin/influencers.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Plus, X, ChevronDown, ChevronUp, Trash2, LayoutList, Columns, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../../AdminShell";
import { useAdminPermissions } from "../../AdminPermissions";

type Candidate = {
  id: string; name: string; mobile: string; email: string | null;
  city: string | null; role_slug: string | null; stage: string;
  knowledge_score: number | null; product_score: number | null;
  crm_score: number | null; sales_score: number | null;
  trust_score: number | null; final_score: number | null;
  ai_recommendation: string | null;
  current_salary: number | null; expected_salary: number | null;
  offered_salary: number | null; pool_tag: string | null; notes: string | null;
  address: string | null; locality: string | null; landmark: string | null;
  latitude: number | null; longitude: number | null;
  distance_km: number | null; details_completed: boolean | null;
  dob: string | null; gender: string | null; marital_status: string | null;
  qualification: string | null; experience_years: number | null;
  languages: string | null; current_company: string | null;
  created_at: string;
};

type StageLog = { id: string; stage: string; changed_at: string; changed_by?: string };

// Full pipeline stages in order
const PIPELINE: { key: string; label: string; emoji: string }[] = [
  { key: "applied",              label: "Applied",           emoji: "📝" },
  { key: "training_started",     label: "Training Started",  emoji: "📚" },
  { key: "training_completed",   label: "Training Done",     emoji: "✅" },
  { key: "assessment_started",   label: "Test Started",      emoji: "🧠" },
  { key: "assessment_completed", label: "Test Submitted",    emoji: "📤" },
  { key: "passed",               label: "Passed",            emoji: "🎯" },
  { key: "interview_eligible",   label: "Interview Ready",   emoji: "📋" },
  { key: "interview_scheduled",  label: "Interview Set",     emoji: "📅" },
  { key: "selected",             label: "Selected",          emoji: "⭐" },
  { key: "offer_sent",           label: "Offer Sent",        emoji: "📨" },
  { key: "offer_accepted",       label: "Offer Accepted",    emoji: "🤝" },
  { key: "hired",                label: "Hired",             emoji: "🚀" },
];

const TERMINAL: { key: string; label: string; emoji: string }[] = [
  { key: "rejected",   label: "Rejected",    emoji: "❌" },
  { key: "talent_pool",label: "Talent Pool", emoji: "🌟" },
];

const ALL_STAGES = [...PIPELINE, ...TERMINAL];
const STAGE_LABEL: Record<string, string> = Object.fromEntries(ALL_STAGES.map(s => [s.key, s.label]));
const STAGE_EMOJI: Record<string, string> = Object.fromEntries(ALL_STAGES.map(s => [s.key, s.emoji]));

const ROLES = ["telecaller","sales-executive","support-executive","marketing-executive","ai-operator","designer","developer","hr-executive"];

// Exclude content-creator — managed in Influencer Hub
const NON_CC_FILTER = "content-creator";

function stageIndex(s: string) { return PIPELINE.findIndex(p => p.key === s); }

export default function CandidatesPage() {
  const { loading: pLoading, has, email, role } = useAdminPermissions();
  const canView    = has("hr.view");
  const canManage  = has("hr.manage");
  const isFounder  = role === "founder";

  type CCData = {
    referral_code: string; referral_status: string; ai_score?: number; ai_verdict?: string;
    niche?: string; followers_count?: string; avg_views?: string;
    instagram_url?: string; youtube_url?: string; facebook_url?: string; other_url?: string;
  };

  const [rows, setRows]         = useState<Candidate[]>([]);
  const [loading, setLoading]   = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [roleFilter, setRoleFilter]   = useState("all");
  const [viewMode, setViewMode]       = useState<"list" | "pipeline">("list");
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [stageLogs, setStageLogs]     = useState<Record<string, StageLog[]>>({});
  const [refreshKey, setRefreshKey]   = useState(0);
  const [showNew, setShowNew]         = useState(false);

  // form
  const [fName, setFName] = useState(""); const [fMobile, setFMobile] = useState("");
  const [fEmail, setFEmail] = useState(""); const [fCity, setFCity] = useState("");
  const [fRole, setFRole] = useState("telecaller"); const [fSaving, setFSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .neq("role_slug", NON_CC_FILTER)   // exclude content-creator
        .order("created_at", { ascending: false });
      setRows((data as Candidate[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault();
    if (!fName || !fMobile) return;
    setFSaving(true);
    const { data: created } = await supabase.from("candidates").insert({
      name: fName, mobile: fMobile, email: fEmail || null, city: fCity || null,
      role_slug: fRole, source: "manual", stage: "applied",
    }).select("id").single();
    // log initial stage
    if (created?.id) {
      await supabase.from("candidate_stage_log").insert({ candidate_id: created.id, stage: "applied", changed_by: email ?? "admin" });
    }
    setFName(""); setFMobile(""); setFEmail(""); setFCity(""); setFRole("telecaller");
    setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  async function expandRow(id: string) {
    const next = expanded === id ? null : id;
    setExpanded(next);
    // Lazy-load stage log for this candidate
    if (next && !stageLogs[id]) {
      const { data } = await supabase
        .from("candidate_stage_log")
        .select("id, stage, changed_at, changed_by")
        .eq("candidate_id", id)
        .order("changed_at", { ascending: true });
      if (data) setStageLogs(prev => ({ ...prev, [id]: data as StageLog[] }));
    }
  }

  async function setStage(id: string, stage: string) {
    await fetch("/api/admin/candidates/stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: id, stage, changed_by: email ?? "admin" }),
    });
    // refresh log for this candidate
    const { data } = await supabase
      .from("candidate_stage_log")
      .select("id, stage, changed_at, changed_by")
      .eq("candidate_id", id)
      .order("changed_at", { ascending: true });
    if (data) setStageLogs(prev => ({ ...prev, [id]: data as StageLog[] }));
    setRefreshKey((k) => k + 1);
  }

  async function saveScores(id: string, patch: Partial<Candidate>) {
    const c = rows.find((r) => r.id === id);
    const merged = { ...c, ...patch } as Candidate;
    const parts = [merged.knowledge_score, merged.product_score, merged.crm_score, merged.sales_score].filter((x): x is number => x != null);
    const final = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null;
    await supabase.from("candidates").update({ ...patch, final_score: final, updated_at: new Date().toISOString() }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  async function removeCandidate(id: string, name: string) {
    if (!isFounder) return;
    if (!window.confirm(`Remove "${name}" permanently?\n\nThis will delete the candidate and all related records. This action cannot be undone.`)) return;
    await supabase.from("candidates").delete().eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (expanded === id) setExpanded(null);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  // Filters
  const filtered = rows.filter(c => {
    if (stageFilter !== "all" && c.stage !== stageFilter) return false;
    if (roleFilter  !== "all" && c.role_slug !== roleFilter)   return false;
    return true;
  });

  // ── Stage Timeline component ──
  function StageTimeline({ candidateId, currentStage }: { candidateId: string; currentStage: string }) {
    const logs = stageLogs[candidateId] ?? [];
    const logMap: Record<string, string> = {};
    for (const l of logs) logMap[l.stage] = l.changed_at;

    const currentIdx = stageIndex(currentStage);
    const isTerminal = TERMINAL.some(t => t.key === currentStage);

    return (
      <div className="mt-4">
        <p className={`mb-3 text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>
          📍 Candidate Journey
        </p>
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[15px] top-0 h-full w-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-1">
            {PIPELINE.map((step, idx) => {
              const done    = currentIdx > idx || (logMap[step.key] !== undefined);
              const current = currentStage === step.key;
              const ts      = logMap[step.key];
              return (
                <div key={step.key} className="relative flex items-start gap-3 pl-9">
                  {/* Node */}
                  <div className={`absolute left-0 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 text-xs transition-all ${
                    current
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                      : done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800"
                  }`}>
                    {done && !current ? "✓" : step.emoji}
                  </div>
                  {/* Label */}
                  <div className={`py-1 ${current ? "font-black text-indigo-600 dark:text-indigo-300" : done ? "text-slate-700 dark:text-slate-200" : adminMutedCls}`}>
                    <span className="text-xs font-semibold">{step.label}</span>
                    {ts && (
                      <span className={`ml-2 text-[10px] ${adminMutedCls}`}>
                        {new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Terminal state */}
            {isTerminal && (
              <div className="relative flex items-start gap-3 pl-9">
                <div className={`absolute left-0 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 text-xs ${
                  currentStage === "rejected"
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-amber-500 bg-amber-500 text-white"
                }`}>
                  {STAGE_EMOJI[currentStage]}
                </div>
                <div className={`py-1 font-black ${currentStage === "rejected" ? "text-rose-600" : "text-amber-600"}`}>
                  <span className="text-xs">{STAGE_LABEL[currentStage]}</span>
                  {logMap[currentStage] && (
                    <span className={`ml-2 text-[10px] ${adminMutedCls}`}>
                      {new Date(logMap[currentStage]).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Stage progress mini bar ──
  function StageMiniBar({ stage }: { stage: string }) {
    const idx      = stageIndex(stage);
    const total    = PIPELINE.length - 1;
    const pct      = idx < 0 ? 0 : Math.round((idx / total) * 100);
    const terminal = TERMINAL.some(t => t.key === stage);
    const color    = terminal
      ? (stage === "rejected" ? "bg-rose-500" : "bg-amber-500")
      : stage === "hired" ? "bg-emerald-500" : "bg-indigo-500";
    return (
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: terminal ? "100%" : `${pct}%` }} />
        </div>
        <span className={`text-[10px] font-bold tabular-nums ${adminMutedCls}`}>{terminal ? STAGE_LABEL[stage] : `${pct}%`}</span>
      </div>
    );
  }

  // ── Pipeline Kanban view ──
  function PipelineView() {
    const groups = PIPELINE.map(s => ({
      ...s,
      candidates: filtered.filter(c => c.stage === s.key),
    })).filter(g => g.candidates.length > 0);

    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: `${groups.length * 220}px` }}>
          {groups.map(g => (
            <div key={g.key} className={`w-52 flex-shrink-0 rounded-xl border ${adminCardCls}`}>
              <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                <p className="text-[11px] font-black">
                  {g.emoji} {g.label}
                  <span className={`ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] dark:bg-indigo-500/20 dark:text-indigo-300 text-indigo-700`}>
                    {g.candidates.length}
                  </span>
                </p>
              </div>
              <div className="space-y-2 p-2">
                {g.candidates.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setViewMode("list"); setTimeout(() => expandRow(c.id), 50); }}
                    className={`w-full rounded-lg border p-2.5 text-left transition hover:border-indigo-400 ${adminCardCls}`}
                  >
                    <p className="text-xs font-bold truncate">{c.name}</p>
                    <p className={`text-[10px] truncate ${adminMutedCls}`}>{c.mobile}</p>
                    <p className={`text-[10px] capitalize ${adminMutedCls}`}>{c.role_slug?.replace("-", " ") ?? "—"}</p>
                    {c.final_score != null && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {c.final_score}%
                      </span>
                    )}
                    <p className={`mt-1 text-[9px] ${adminMutedCls}`}>{new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      breadcrumbs={[{ label: "Recruitment", href: "/admin/recruitment" }, { label: "Candidates" }]}
      title="Candidates"
      subtitle="Hiring pipeline — apply → training → test → interview → hired"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && <button type="button" onClick={() => setShowNew(s => !s)} className={adminPrimaryBtnCls}><Plus className="h-3.5 w-3.5" />Add</button>}
          <button type="button" onClick={() => setViewMode(v => v === "list" ? "pipeline" : "list")} className={adminSecondaryBtnCls} title="Toggle view">
            {viewMode === "list" ? <Columns className="h-3.5 w-3.5" /> : <LayoutList className="h-3.5 w-3.5" />}
            {viewMode === "list" ? "Pipeline" : "List"}
          </button>
          <button type="button" onClick={() => setRefreshKey(k => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {/* Add form */}
      {showNew && canManage && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Add Candidate</p>
            <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <form onSubmit={addCandidate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input className={adminInputCls} placeholder="Name *" value={fName} onChange={e => setFName(e.target.value)} required />
            <input className={adminInputCls} placeholder="Mobile *" value={fMobile} onChange={e => setFMobile(e.target.value)} required />
            <input className={adminInputCls} placeholder="Email" value={fEmail} onChange={e => setFEmail(e.target.value)} />
            <input className={adminInputCls} placeholder="City" value={fCity} onChange={e => setFCity(e.target.value)} />
            <select className={adminInputCls} value={fRole} onChange={e => setFRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/-/g, " ")}</option>)}
            </select>
            <button type="submit" disabled={fSaving} className={`${adminPrimaryBtnCls} lg:col-span-5 justify-center`}>{fSaving ? "Saving…" : "Add Candidate"}</button>
          </form>
        </section>
      )}

      {/* Influencer note */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700 dark:border-pink-400/20 dark:bg-pink-500/5 dark:text-pink-300">
        📸 Content Creator / Influencer applications are managed separately →
        <a href="/admin/influencers" className="font-black underline hover:text-pink-900 dark:hover:text-pink-100">Open Influencer Hub</a>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Stage filter */}
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setStageFilter("all")} className={`rounded-full px-3 py-1 text-xs font-bold transition ${stageFilter === "all" ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700"}`}>All ({rows.length})</button>
          {ALL_STAGES.filter(s => rows.some(r => r.stage === s.key)).map(s => (
            <button key={s.key} onClick={() => setStageFilter(s.key)} className={`rounded-full px-3 py-1 text-xs font-bold transition ${stageFilter === s.key ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700"}`}>
              {s.emoji} {s.label} ({rows.filter(r => r.stage === s.key).length})
            </button>
          ))}
        </div>
        {/* Role filter */}
        <select className={`${adminInputCls} !py-1 text-xs`} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/-/g, " ")}</option>)}
        </select>
      </div>

      {loading ? (
        <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} p-10 text-center`}><p className={`text-sm ${adminMutedCls}`}>No candidates.</p></div>
      ) : viewMode === "pipeline" ? (
        <PipelineView />
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const open = expanded === c.id;
            return (
              <div key={c.id} className={adminCardCls}>
                {/* Row header */}
                <div className="flex items-center justify-between gap-3 p-4">
                  <button type="button" onClick={() => expandRow(c.id)} className="flex min-w-0 flex-1 flex-col text-left">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white dark:from-indigo-500 dark:to-indigo-700">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold">{c.name}</p>
                          {c.final_score != null && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{c.final_score}%</span>}
                        </div>
                        <p className={`text-[11px] ${adminMutedCls}`}>{c.mobile}{c.email && ` · ${c.email}`} · <span className="capitalize">{c.role_slug?.replace(/-/g, " ") ?? "—"}</span>{c.city && ` · ${c.city}`}</p>
                        {/* Stage progress bar */}
                        <StageMiniBar stage={c.stage} />
                      </div>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px]">{STAGE_EMOJI[c.stage]}</span>
                      {canManage ? (
                        <select className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900" value={c.stage} onChange={e => setStage(c.id, e.target.value)}>
                          {ALL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold dark:bg-slate-800">{STAGE_LABEL[c.stage]}</span>
                      )}
                    </div>
                    {isFounder && (
                      <button type="button" title="Remove" onClick={() => removeCandidate(c.id, c.name)} className="flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 text-rose-400 transition hover:border-rose-400 hover:bg-rose-50 dark:border-rose-500/30">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => expandRow(c.id)}>{open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}</button>
                  </div>
                </div>

                {/* Expanded detail */}
                {open && (
                  <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                    {/* ── Stage Timeline ── */}
                    <StageTimeline candidateId={c.id} currentStage={c.stage} />

                    {/* ── Scores ── */}
                    <p className={`mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Scores (0–100)</p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {(["knowledge_score","product_score","crm_score","sales_score"] as const).map(k => (
                        <div key={k}>
                          <label className={`text-[10px] capitalize ${adminMutedCls}`}>{k.replace("_score","")}</label>
                          <input type="number" className={`${adminInputCls} mt-0.5`} defaultValue={c[k] ?? ""} disabled={!canManage}
                            onBlur={e => canManage && e.target.value !== String(c[k] ?? "") && saveScores(c.id, { [k]: e.target.value ? parseInt(e.target.value) : null } as any)} />
                        </div>
                      ))}
                    </div>

                    {/* ── Salary + AI rec ── */}
                    <p className={`mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Salary &amp; Recommendation</p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <div><label className={`text-[10px] ${adminMutedCls}`}>Expected ₹</label><input type="number" className={`${adminInputCls} mt-0.5`} defaultValue={c.expected_salary ?? ""} disabled={!canManage} onBlur={e => canManage && saveScores(c.id, { expected_salary: e.target.value ? parseFloat(e.target.value) : null } as any)} /></div>
                      <div><label className={`text-[10px] ${adminMutedCls}`}>Offered ₹</label><input type="number" className={`${adminInputCls} mt-0.5`} defaultValue={c.offered_salary ?? ""} disabled={!canManage} onBlur={e => canManage && saveScores(c.id, { offered_salary: e.target.value ? parseFloat(e.target.value) : null } as any)} /></div>
                      <div>
                        <label className={`text-[10px] ${adminMutedCls}`}>AI Recommendation</label>
                        <select className={`${adminInputCls} mt-0.5`} defaultValue={c.ai_recommendation ?? ""} disabled={!canManage} onChange={e => saveScores(c.id, { ai_recommendation: e.target.value || null } as any)}>
                          <option value="">—</option><option value="hire">Hire</option><option value="hold">Hold</option><option value="reject">Reject</option>
                        </select>
                      </div>
                      <div>
                        <label className={`text-[10px] ${adminMutedCls}`}>Talent Pool</label>
                        <select className={`${adminInputCls} mt-0.5`} defaultValue={c.pool_tag ?? ""} disabled={!canManage} onChange={e => saveScores(c.id, { pool_tag: e.target.value || null } as any)}>
                          <option value="">—</option><option value="future">Future Talent</option><option value="high_potential">High Potential</option><option value="rehire">Rehire Later</option>
                        </select>
                      </div>
                    </div>

                    {/* ── Personal ── */}
                    {c.email && <p className={`mt-3 text-[11px] ${adminMutedCls}`}>📧 {c.email}</p>}
                    {(c.dob || c.gender || c.marital_status || c.qualification) && (
                      <div className="mt-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/40">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Personal</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                          {c.dob && <span>🎂 {new Date(c.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                          {c.gender && <span>{c.gender}</span>}
                          {c.marital_status && <span>💍 {c.marital_status}</span>}
                          {c.qualification && <span>🎓 {c.qualification}</span>}
                          {c.experience_years != null && <span>💼 {c.experience_years} yr exp</span>}
                          {c.languages && <span>🗣️ {c.languages}</span>}
                          {c.current_company && <span>🏢 {c.current_company}</span>}
                        </div>
                      </div>
                    )}

                    {/* ── Location ── */}
                    {(c.address || c.landmark) && (
                      <div className="mt-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/40">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Location</p>
                        {c.address && <p className="mt-0.5 text-xs">{c.address}</p>}
                        {c.locality && <p className={`text-[11px] ${adminMutedCls}`}>Area: {c.locality}</p>}
                        {c.landmark && <p className={`text-[11px] ${adminMutedCls}`}>Landmark: {c.landmark}</p>}
                        <div className="mt-1 flex items-center gap-3">
                          {c.distance_km != null && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">📍 {c.distance_km} km from office</span>}
                          {c.latitude && c.longitude && (
                            <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-300">View on map →</a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Applied date */}
                    <p className={`mt-3 text-[10px] ${adminMutedCls}`}>
                      <Clock className="mr-1 inline h-3 w-3" />
                      Applied: {new Date(c.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
