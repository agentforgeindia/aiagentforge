"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BookOpen, CheckCircle, Lock, Clock, ChevronRight, Loader2, AlertCircle, Trophy, Target, BarChart3 } from "lucide-react";

type Module = {
  id: string; number: number; title: string; description: string;
  duration_min: number; content: Array<{ type: string; value: string }>;
};
type Progress = { module_id: string; completed: boolean; quiz_score: number | null };
type Candidate = { id: string; name: string; status: string; assessment_pct: number | null; job_category: string | null };

const TOPIC_ICONS = ["🏢", "💬", "🎯", "🤖", "📊", "💡"];

export default function AcademyPortalPage() {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState("");
  const [inputId, setInputId] = useState("");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [moduleLoading, setModuleLoading] = useState(false);

  async function login() {
    if (!inputId.trim()) { setError("Candidate ID daalo."); return; }
    setLoading(true); setError("");
    const searchId = inputId.trim().length < 36
      ? inputId.trim()
      : inputId.trim();
    const { data: cand } = await supabase
      .from("academy_candidates")
      .select("id,name,status,assessment_pct,job_category")
      .or(`id.eq.${searchId},mobile.eq.${searchId}`)
      .single();
    if (!cand) { setError("Candidate nahi mila. Mobile number ya ID check karo."); setLoading(false); return; }
    const { data: mods } = await supabase.from("academy_modules").select("*").eq("active", true).order("order_index");
    const { data: prog } = await supabase.from("academy_progress").select("*").eq("candidate_id", cand.id);
    setCandidate(cand);
    setModules(mods || []);
    setProgress(prog || []);
    setCandidateId(cand.id);
    setLoading(false);
  }

  async function markComplete(moduleId: string) {
    setModuleLoading(true);
    await supabase.from("academy_progress").upsert({
      candidate_id: candidateId, module_id: moduleId,
      completed: true, completed_at: new Date().toISOString(),
    }, { onConflict: "candidate_id,module_id" });
    const { data: prog } = await supabase.from("academy_progress").select("*").eq("candidate_id", candidateId);
    setProgress(prog || []);
    setActiveModule(null);
    setModuleLoading(false);
  }

  const completedCount = progress.filter(p => p.completed).length;
  const totalPct = modules.length ? Math.round(completedCount * 100 / modules.length) : 0;

  if (!candidate) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <BookOpen className="mx-auto mb-3 h-12 w-12 text-cyan-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Learning Portal</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Apna registered mobile number ya candidate ID daalo</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-white/5 p-6 shadow-sm">
            <input
              type="text" value={inputId} onChange={e => { setInputId(e.target.value); setError(""); }}
              placeholder="Mobile number ya candidate ID"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-400"
              onKeyDown={e => e.key === "Enter" && login()}
            />
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            <button onClick={login} disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 py-3 font-semibold text-white disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Login
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Registration nahi kiya? <a href="/academy/register" className="text-cyan-500 hover:underline">Pehle register karo</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (activeModule) {
    const isCompleted = progress.some(p => p.module_id === activeModule.id && p.completed);
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <button onClick={() => setActiveModule(null)} className="mb-5 flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-500 transition-colors">
            ← Back to Portal
          </button>
          <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-white/5 p-6 shadow-sm">
            <div className="mb-1 text-2xl">{TOPIC_ICONS[activeModule.number - 1]}</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Module {activeModule.number}: {activeModule.title}</h2>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" /> {activeModule.duration_min} min</p>
            <div className="mt-5 space-y-3">
              {activeModule.content?.map((block, i) => {
                if (block.type === "heading") return <h3 key={i} className="mt-4 text-base font-bold text-slate-900 dark:text-white">{block.value}</h3>;
                if (block.type === "bullet") return (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500" />
                    <span>{block.value}</span>
                  </div>
                );
                return <p key={i} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{block.value}</p>;
              })}
            </div>
            <div className="mt-6">
              {isCompleted ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" /> Module completed!
                </div>
              ) : (
                <button onClick={() => markComplete(activeModule.id)} disabled={moduleLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 py-3 font-semibold text-white disabled:opacity-60">
                  {moduleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Module Complete Mark Karo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">

        {/* Welcome */}
        <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-5">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Namaste, {candidate.name}! 👋</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 capitalize">
            Status: <span className="font-medium text-cyan-600 dark:text-cyan-400">{candidate.status.replace("_", " ")}</span>
            {candidate.job_category && ` · ${candidate.job_category.replace("_", " ")}`}
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 p-4 text-center">
            <Trophy className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
            <p className="text-xl font-bold text-slate-900 dark:text-white">{candidate.assessment_pct ?? "–"}%</p>
            <p className="text-xs text-slate-400">Test Score</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 p-4 text-center">
            <BookOpen className="mx-auto mb-1 h-5 w-5 text-cyan-500" />
            <p className="text-xl font-bold text-slate-900 dark:text-white">{completedCount}/{modules.length}</p>
            <p className="text-xs text-slate-400">Modules Done</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 p-4 text-center">
            <BarChart3 className="mx-auto mb-1 h-5 w-5 text-purple-500" />
            <p className="text-xl font-bold text-slate-900 dark:text-white">{totalPct}%</p>
            <p className="text-xs text-slate-400">Progress</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Training Progress</span>
            <span className="text-slate-500">{totalPct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all" style={{ width: `${totalPct}%` }} />
          </div>
        </div>

        {/* Assessment reminder */}
        {candidate.status === "assessment_pending" && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Assessment baaki hai</p>
                <p className="text-xs text-slate-500 mt-0.5">Modules unlock hone ke liye pehle assessment do.</p>
                <a href={`/academy/assessment?id=${candidate.id}`}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-all">
                  Assessment Dena Hai <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Modules */}
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Training Modules</h2>
        <div className="space-y-3">
          {modules.map((mod, i) => {
            const prog = progress.find(p => p.module_id === mod.id);
            const isCompleted = !!prog?.completed;
            const isLocked = candidate.status === "assessment_pending";
            return (
              <button key={mod.id} disabled={isLocked}
                onClick={() => !isLocked && setActiveModule(mod)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : isLocked ? "border-slate-200 dark:border-white/5 opacity-50 cursor-not-allowed" : "border-white/20 bg-white/60 dark:bg-white/5 hover:border-cyan-400/50 hover:shadow-sm"}`}>
                <span className="text-2xl">{TOPIC_ICONS[i]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-400">Module {mod.number}</p>
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{mod.title}</p>
                  <p className="text-xs text-slate-400">{mod.description}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-0.5 text-slate-400"><Clock className="h-3 w-3" />{mod.duration_min}m</span>
                  {isCompleted ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : isLocked ? <Lock className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* All done */}
        {completedCount === modules.length && modules.length > 0 && (
          <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-center">
            <Trophy className="mx-auto mb-2 h-10 w-10 text-yellow-500" />
            <p className="font-bold text-slate-900 dark:text-white">Sab modules complete! 🎉</p>
            <p className="text-sm text-slate-500 mt-1">Aapki training complete ho gayi. Team aapse kaam ke baare mein contact karegi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
