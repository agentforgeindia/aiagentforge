"use client";

// /admin/recruitment/questions — MCQ question bank.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Plus, X, Trash2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../../AdminShell";
import { useAdminPermissions } from "../../AdminPermissions";

type Q = {
  id: string; role_slug: string | null; section: string; difficulty: string;
  question: string; options: string[]; correct_idx: number;
};

const SECTIONS = ["basic", "product", "crm", "sales", "aptitude"];
const ROLES = ["", "telecaller","sales-executive","support-executive","marketing-executive","content-creator","ai-operator","designer","developer"];
const DIFF = ["easy", "medium", "hard"];

export default function QuestionBankPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("hr.view");
  const canManage = has("hr.manage");

  const [rows, setRows]       = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [secFilter, setSecFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNew, setShowNew] = useState(false);

  // form
  const [fRole, setFRole] = useState("");
  const [fSec, setFSec]   = useState("basic");
  const [fDiff, setFDiff] = useState("medium");
  const [fQ, setFQ]       = useState("");
  const [fOpts, setFOpts] = useState(["", "", "", ""]);
  const [fCorrect, setFCorrect] = useState(0);
  const [fSaving, setFSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("recruitment_questions").select("*").order("created_at", { ascending: false });
      setRows((data as Q[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function addQ(e: React.FormEvent) {
    e.preventDefault();
    if (!fQ || fOpts.some((o) => !o.trim())) return;
    setFSaving(true);
    await supabase.from("recruitment_questions").insert({
      role_slug: fRole || null, section: fSec, difficulty: fDiff,
      question: fQ, options: fOpts, correct_idx: fCorrect,
    });
    setFQ(""); setFOpts(["", "", "", ""]); setFCorrect(0);
    setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  async function del(id: string) {
    if (!confirm("Delete this question?")) return;
    await supabase.from("recruitment_questions").delete().eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const filtered = secFilter === "all" ? rows : rows.filter((r) => r.section === secFilter);

  return (
    <AdminShell
      breadcrumbs={[{ label: "Recruitment", href: "/admin/recruitment" }, { label: "Question Bank" }]}
      title="Question Bank"
      subtitle="MCQ questions for candidate assessments"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}><Plus className="h-3.5 w-3.5" />Add Question</button>}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {showNew && canManage && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Add Question</p>
            <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <form onSubmit={addQ} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <select className={adminInputCls} value={fRole} onChange={(e) => setFRole(e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r ? r.replace("-", " ") : "Common (all roles)"}</option>)}
              </select>
              <select className={adminInputCls} value={fSec} onChange={(e) => setFSec(e.target.value)}>
                {SECTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
              <select className={adminInputCls} value={fDiff} onChange={(e) => setFDiff(e.target.value)}>
                {DIFF.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
            </div>
            <textarea className={adminInputCls} rows={2} placeholder="Question text" value={fQ} onChange={(e) => setFQ(e.target.value)} required />
            <div className="grid gap-2 sm:grid-cols-2">
              {fOpts.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => setFCorrect(i)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${fCorrect === i ? "bg-emerald-500 text-white" : "border border-slate-300 text-slate-400"}`}>{fCorrect === i ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + i)}</button>
                  <input className={adminInputCls} placeholder={`Option ${String.fromCharCode(65 + i)}`} value={o} onChange={(e) => setFOpts((prev) => prev.map((x, j) => j === i ? e.target.value : x))} required />
                </div>
              ))}
            </div>
            <p className={`text-[11px] ${adminMutedCls}`}>Green circle = correct answer. Click to set.</p>
            <button type="submit" disabled={fSaving} className={adminPrimaryBtnCls}>{fSaving ? "Saving…" : "Add Question"}</button>
          </form>
        </section>
      )}

      {/* Section filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setSecFilter("all")} className={`rounded-full px-3 py-1 text-xs font-bold transition ${secFilter === "all" ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>All ({rows.length})</button>
        {SECTIONS.map((s) => (
          <button key={s} type="button" onClick={() => setSecFilter(s)} className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition ${secFilter === s ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>{s} ({rows.filter((r) => r.section === s).length})</button>
        ))}
      </div>

      {loading ? (
        <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} p-10 text-center`}><p className={`text-sm ${adminMutedCls}`}>No questions yet. Add your first MCQ!</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <div key={q.id} className={`${adminCardCls} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold capitalize text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{q.section}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">{q.difficulty}</span>
                    {q.role_slug && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold capitalize text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">{q.role_slug.replace("-", " ")}</span>}
                  </div>
                  <p className="text-sm font-medium">{q.question}</p>
                  <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                    {q.options.map((o, i) => (
                      <li key={i} className={`text-xs ${i === q.correct_idx ? "font-bold text-emerald-600 dark:text-emerald-300" : adminMutedCls}`}>
                        {i === q.correct_idx ? "✓ " : `${String.fromCharCode(65 + i)}. `}{o}
                      </li>
                    ))}
                  </ul>
                </div>
                {canManage && <button type="button" onClick={() => del(q.id)} className="shrink-0 text-rose-500 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
          ))}
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
