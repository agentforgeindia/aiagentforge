"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, CheckCircle, Loader2, AlertCircle, ChevronRight, ChevronLeft, Trophy } from "lucide-react";

type Question = {
  id: string; topic: string; question: string; options: string[]; answer: number;
};

const TOPIC_LABELS: Record<string, string> = {
  english: "English", communication: "Communication", computer: "Computer",
  internet: "Internet", ai: "AI Awareness", sales: "Sales Aptitude",
};

const TOPIC_COLORS: Record<string, string> = {
  english: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  communication: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  computer: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  internet: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ai: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  sales: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

const TOTAL_TIME = 30 * 60; // 30 minutes

function AssessmentInner() {
  const params = useSearchParams();
  const router = useRouter();
  const candidateId = params.get("id") || "";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; pct: number } | null>(null);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const elapsed = TOTAL_TIME - timeLeft;
    let score = 0;
    questions.forEach(q => { if (answers[q.id] === q.answer) score++; });
    const total = questions.length;
    try {
      await supabase.from("academy_assessments").insert({
        candidate_id: candidateId, answers, score, total,
        time_taken: elapsed, completed_at: new Date().toISOString(),
      });
      await supabase.from("academy_candidates").update({
        assessment_score: score, assessment_total: total,
        assessment_done_at: new Date().toISOString(),
        status: score / total >= 0.5 ? "training" : "applied",
      }).eq("id", candidateId);
      setResult({ score, total, pct: Math.round(score * 100 / total) });
      setSubmitted(true);
    } catch (e: unknown) {
      setError((e as Error).message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, submitted, questions, answers, candidateId, timeLeft]);

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from("academy_questions")
        .select("id,topic,question,options,answer")
        .eq("active", true)
        .limit(30);
      if (err || !data) { setError("Questions load nahi hue. Refresh karo."); setLoading(false); return; }
      const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 30);
      setQuestions(shuffled);
      setLoading(false);
    }
    if (candidateId) load(); else setError("Invalid link. Register se dobara try karo.");
  }, [candidateId]);

  useEffect(() => {
    if (loading || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, submitted, handleSubmit]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const answered = Object.keys(answers).length;
  const pctDone = questions.length ? Math.round(answered * 100 / questions.length) : 0;

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
    </div>
  );

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
        <p className="text-slate-700 dark:text-slate-300">{error}</p>
      </div>
    </div>
  );

  if (submitted && result) return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 dark:bg-white/5 p-8 text-center shadow-lg">
        <Trophy className={`mx-auto mb-4 h-16 w-16 ${result.pct >= 50 ? "text-yellow-500" : "text-slate-400"}`} />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Assessment Complete!</h2>
        <div className="mt-6 rounded-xl bg-slate-50 dark:bg-white/5 p-5">
          <p className="text-4xl font-bold text-slate-900 dark:text-white">{result.score}/{result.total}</p>
          <p className="text-lg font-semibold mt-1 text-slate-600 dark:text-slate-400">{result.pct}% Score</p>
        </div>
        {result.pct >= 50 ? (
          <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <CheckCircle className="mx-auto mb-2 h-7 w-7 text-emerald-500" />
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">Congratulations! Aap training ke liye qualify kar gaye hain.</p>
            <p className="mt-1 text-sm text-slate-500">Team aapse 24–48 hours mein contact karegi.</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
            <p className="font-semibold text-amber-700 dark:text-amber-400">Is baar 50% se kam aaya. Practice karo aur dobara try karo.</p>
          </div>
        )}
        <button onClick={() => router.push("/academy")}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 py-3 font-semibold text-white">
          Academy Home
        </button>
      </div>
    </div>
  );

  const q = questions[current];
  const urgentTime = timeLeft < 300;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Question {current + 1} of {questions.length}</p>
            <div className="mt-1 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${urgentTime ? "bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse" : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white"}`}>
            <Clock className="h-4 w-4" /> {fmt(timeLeft)}
          </div>
        </div>

        {/* Progress chips */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {questions.map((qq, i) => (
            <button key={qq.id} onClick={() => setCurrent(i)}
              className={`h-6 w-6 rounded-full text-xs font-bold transition-all ${i === current ? "bg-cyan-500 text-white" : answers[qq.id] !== undefined ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-slate-200 dark:bg-white/10 text-slate-500"}`}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-white/5 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${TOPIC_COLORS[q.topic] || "bg-slate-100 text-slate-600"}`}>
              {TOPIC_LABELS[q.topic] || q.topic}
            </span>
          </div>
          <h2 className="text-base font-semibold leading-relaxed text-slate-900 dark:text-white">{q.question}</h2>
          <div className="mt-5 space-y-3">
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-all ${answers[q.id] === i ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-medium" : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-cyan-300 hover:bg-cyan-500/5"}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${answers[q.id] === i ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500"}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <button disabled={current === 0} onClick={() => setCurrent(c => c - 1)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:border-cyan-400 transition-all">
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <p className="text-xs text-slate-400">{answered}/{questions.length} answered</p>
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:border-cyan-400 transition-all">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => handleSubmit(false)} disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <>Submit Test <CheckCircle className="h-4 w-4" /></>}
            </button>
          )}
        </div>

        {/* Submit all */}
        {answered === questions.length && current < questions.length - 1 && (
          <div className="mt-4 text-center">
            <button onClick={() => handleSubmit(false)} disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-3 font-semibold text-white shadow disabled:opacity-60">
              {submitting ? "Submitting..." : "Submit Test Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcademyAssessmentPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" /></div>}>
      <AssessmentInner />
    </Suspense>
  );
}
