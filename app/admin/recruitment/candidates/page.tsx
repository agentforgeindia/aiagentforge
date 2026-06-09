"use client";

// /admin/recruitment/candidates — candidate pipeline management.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Plus, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
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

const STAGES = [
  "applied","training_started","training_completed","assessment_started",
  "assessment_completed","passed","interview_eligible","interview_scheduled",
  "selected","offer_sent","offer_accepted","hired","rejected","talent_pool",
];
const STAGE_LABEL: Record<string, string> = {
  applied: "Applied", training_started: "Training Started", training_completed: "Training Done",
  assessment_started: "Test Started", assessment_completed: "Test Done", passed: "Passed",
  interview_eligible: "Interview Eligible", interview_scheduled: "Interview Scheduled",
  selected: "Selected", offer_sent: "Offer Sent", offer_accepted: "Offer Accepted",
  hired: "Hired", rejected: "Rejected", talent_pool: "Talent Pool",
};
const ROLES = ["telecaller","sales-executive","support-executive","marketing-executive","content-creator","ai-operator","designer","developer","hr-executive"];

export default function CandidatesPage() {
  const { loading: pLoading, has, email, role } = useAdminPermissions();
  const canView    = has("hr.view");
  const canManage  = has("hr.manage");
  const isFounder  = role === "founder";

  const [rows, setRows]       = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNew, setShowNew] = useState(false);

  // form
  const [fName, setFName] = useState(""); const [fMobile, setFMobile] = useState("");
  const [fEmail, setFEmail] = useState(""); const [fCity, setFCity] = useState("");
  const [fRole, setFRole] = useState("telecaller"); const [fSaving, setFSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("candidates").select("*").order("created_at", { ascending: false });
      setRows((data as Candidate[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault();
    if (!fName || !fMobile) return;
    setFSaving(true);
    await supabase.from("candidates").insert({
      name: fName, mobile: fMobile, email: fEmail || null, city: fCity || null,
      role_slug: fRole, source: "manual",
    });
    setFName(""); setFMobile(""); setFEmail(""); setFCity(""); setFRole("telecaller");
    setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  async function setStage(id: string, stage: string) {
    // Use API so content-creator records auto-sync to influencer hub on selection
    await fetch("/api/admin/candidates/stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: id, stage }),
    });
    setRefreshKey((k) => k + 1);
  }

  async function saveScores(id: string, patch: Partial<Candidate>) {
    // recompute final as avg of available scores
    const c = rows.find((r) => r.id === id);
    const merged = { ...c, ...patch } as Candidate;
    const parts = [merged.knowledge_score, merged.product_score, merged.crm_score, merged.sales_score].filter((x): x is number => x != null);
    const final = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null;
    await supabase.from("candidates").update({ ...patch, final_score: final, updated_at: new Date().toISOString() }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  async function removeCandidate(id: string, name: string) {
    if (!isFounder) return;
    const confirmed = window.confirm(
      `Remove "${name}" permanently?\n\nThis will delete the candidate and all related records (scores, social links, payments). This action cannot be undone.`
    );
    if (!confirmed) return;
    await supabase.from("candidates").delete().eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (expanded === id) setExpanded(null);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const filtered = stageFilter === "all" ? rows : rows.filter((r) => r.stage === stageFilter);

  return (
    <AdminShell
      breadcrumbs={[{ label: "Recruitment", href: "/admin/recruitment" }, { label: "Candidates" }]}
      title="Candidates"
      subtitle="Pipeline, scores, interviews, offers"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}><Plus className="h-3.5 w-3.5" />Add Candidate</button>}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {/* New form */}
      {showNew && canManage && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Add Candidate</p>
            <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <form onSubmit={addCandidate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input className={adminInputCls} placeholder="Name *" value={fName} onChange={(e) => setFName(e.target.value)} required />
            <input className={adminInputCls} placeholder="Mobile *" value={fMobile} onChange={(e) => setFMobile(e.target.value)} required />
            <input className={adminInputCls} placeholder="Email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
            <input className={adminInputCls} placeholder="City" value={fCity} onChange={(e) => setFCity(e.target.value)} />
            <select className={adminInputCls} value={fRole} onChange={(e) => setFRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace("-", " ")}</option>)}
            </select>
            <button type="submit" disabled={fSaving} className={`${adminPrimaryBtnCls} lg:col-span-5 justify-center`}>{fSaving ? "Saving…" : "Add Candidate"}</button>
          </form>
        </section>
      )}

      {/* Stage filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setStageFilter("all")} className={`rounded-full px-3 py-1 text-xs font-bold transition ${stageFilter === "all" ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>All ({rows.length})</button>
        {STAGES.filter((s) => rows.some((r) => r.stage === s)).map((s) => (
          <button key={s} type="button" onClick={() => setStageFilter(s)} className={`rounded-full px-3 py-1 text-xs font-bold transition ${stageFilter === s ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>
            {STAGE_LABEL[s]} ({rows.filter((r) => r.stage === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} p-10 text-center`}><p className={`text-sm ${adminMutedCls}`}>No candidates.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const open = expanded === c.id;
            return (
              <div key={c.id} className={adminCardCls}>
                <div className="flex items-center justify-between gap-3 p-4">
                  <button type="button" onClick={() => setExpanded(open ? null : c.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white dark:from-indigo-500 dark:to-indigo-700">{c.name[0]?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{c.name}</p>
                      <p className={`text-[11px] ${adminMutedCls}`}>{c.mobile} · {c.role_slug?.replace("-", " ") ?? "—"} {c.city && `· ${c.city}`}</p>
                    </div>
                    {c.final_score != null && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{c.final_score}%</span>}
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    {canManage ? (
                      <select className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900" value={c.stage} onChange={(e) => setStage(c.id, e.target.value)}>
                        {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold dark:bg-slate-800">{STAGE_LABEL[c.stage]}</span>
                    )}
                    {isFounder && (
                      <button
                        type="button"
                        title="Remove candidate (founder only)"
                        onClick={() => removeCandidate(c.id, c.name)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 text-rose-400 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => setExpanded(open ? null : c.id)}>{open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}</button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                    {/* Scores */}
                    <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Scores (0-100)</p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {(["knowledge_score","product_score","crm_score","sales_score"] as const).map((k) => (
                        <div key={k}>
                          <label className={`text-[10px] capitalize ${adminMutedCls}`}>{k.replace("_score","")}</label>
                          <input type="number" className={`${adminInputCls} mt-0.5`} defaultValue={c[k] ?? ""} disabled={!canManage}
                            onBlur={(e) => canManage && e.target.value !== String(c[k] ?? "") && saveScores(c.id, { [k]: e.target.value ? parseInt(e.target.value) : null } as any)} />
                        </div>
                      ))}
                    </div>

                    {/* Salary + AI rec */}
                    <p className={`mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Salary &amp; Recommendation</p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <div><label className={`text-[10px] ${adminMutedCls}`}>Expected ₹</label><input type="number" className={`${adminInputCls} mt-0.5`} defaultValue={c.expected_salary ?? ""} disabled={!canManage} onBlur={(e) => canManage && saveScores(c.id, { expected_salary: e.target.value ? parseFloat(e.target.value) : null } as any)} /></div>
                      <div><label className={`text-[10px] ${adminMutedCls}`}>Offered ₹</label><input type="number" className={`${adminInputCls} mt-0.5`} defaultValue={c.offered_salary ?? ""} disabled={!canManage} onBlur={(e) => canManage && saveScores(c.id, { offered_salary: e.target.value ? parseFloat(e.target.value) : null } as any)} /></div>
                      <div>
                        <label className={`text-[10px] ${adminMutedCls}`}>AI Recommendation</label>
                        <select className={`${adminInputCls} mt-0.5`} defaultValue={c.ai_recommendation ?? ""} disabled={!canManage} onChange={(e) => saveScores(c.id, { ai_recommendation: e.target.value || null } as any)}>
                          <option value="">—</option><option value="hire">Hire</option><option value="hold">Hold</option><option value="reject">Reject</option>
                        </select>
                      </div>
                      <div>
                        <label className={`text-[10px] ${adminMutedCls}`}>Talent Pool</label>
                        <select className={`${adminInputCls} mt-0.5`} defaultValue={c.pool_tag ?? ""} disabled={!canManage} onChange={(e) => saveScores(c.id, { pool_tag: e.target.value || null } as any)}>
                          <option value="">—</option><option value="future">Future Talent</option><option value="high_potential">High Potential</option><option value="rehire">Rehire Later</option>
                        </select>
                      </div>
                    </div>
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
