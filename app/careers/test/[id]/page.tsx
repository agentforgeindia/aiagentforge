"use client";

// /careers/test/[id] — the assessment: per-question timer, anti-cheat,
// auto-advance, server-side grading.

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type Q = { id: string; section: string; difficulty: string; question: string; options: string[]; time: number };
type Result = { total_score: number; section_scores: Record<string, number>; trust_score: number; passed: boolean; recommendation: string };

const MAX_WARNINGS = 3;

export default function TestPage() {
  const { id } = useParams<{ id: string }>();

  const [phase, setPhase]     = useState<"intro" | "loading" | "test" | "result" | "error">("intro");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx]         = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [error, setError]     = useState<string | null>(null);
  const [result, setResult]   = useState<Result | null>(null);
  const startedAt = useRef<number>(0);
  const answersRef = useRef(answers);
  const warnRef = useRef(0);
  const submittedRef = useRef(false);
  answersRef.current = answers;

  // ── Start test: fetch questions ──
  async function start() {
    setPhase("loading");
    const res = await fetch("/api/careers/questions", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidate_id: id }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error ?? "Could not load test."); setPhase("error"); return; }
    setQuestions(json.questions);
    setIdx(0);
    setTimeLeft(json.questions[0]?.time ?? 45);
    startedAt.current = Date.now();
    setPhase("test");
  }

  // ── Submit ──
  const submit = useCallback(async (flags: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const durationSecs = Math.round((Date.now() - startedAt.current) / 1000);
    setPhase("loading");
    const res = await fetch("/api/careers/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: id, answers: answersRef.current, cheat_flags: flags, duration_secs: durationSecs }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error ?? "Submit failed."); setPhase("error"); return; }
    setResult(json); setPhase("result");
  }, [id]);

  // ── Advance to next question (or finish) ──
  const next = useCallback(() => {
    setIdx((cur) => {
      const nx = cur + 1;
      if (nx >= questions.length) { submit(warnRef.current); return cur; }
      setTimeLeft(questions[nx].time);
      return nx;
    });
  }, [questions, submit]);

  // ── Per-question countdown ──
  useEffect(() => {
    if (phase !== "test") return;
    if (timeLeft <= 0) { next(); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, next]);

  // ── Anti-cheat: tab switch + copy/paste ──
  useEffect(() => {
    if (phase !== "test") return;

    function onVis() {
      if (document.visibilityState === "hidden") {
        warnRef.current += 1;
        setWarnings(warnRef.current);
        if (warnRef.current >= MAX_WARNINGS + 1) submit(warnRef.current);
      }
    }
    function block(e: Event) { e.preventDefault(); warnRef.current += 1; setWarnings(warnRef.current); }

    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("copy", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("copy", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [phase, submit]);

  function choose(qid: string, oi: number) {
    setAnswers((p) => ({ ...p, [qid]: oi }));
  }

  // ── RENDER ──
  if (phase === "intro") {
    return (
      <Shell>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Skill Assessment</h1>
        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>⏱️ Each question has its own timer — answer fast.</li>
          <li>🚫 Don't switch tabs or copy-paste — {MAX_WARNINGS} warnings then auto-submit.</li>
          <li>🔁 You get max 3 attempts total.</li>
          <li>✅ Honest answers = best result. Good luck!</li>
        </ul>
        <button onClick={start} className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500">
          Start Test →
        </button>
      </Shell>
    );
  }

  if (phase === "loading") return <Shell><p className="py-10 text-center text-sm text-slate-500">Please wait…</p></Shell>;

  if (phase === "error") {
    return <Shell><div className="py-8 text-center"><p className="text-3xl">😕</p><p className="mt-3 text-sm font-medium text-rose-600">{error}</p></div></Shell>;
  }

  if (phase === "result" && result) {
    return (
      <Shell>
        <div className="text-center">
          <p className="text-5xl">{result.passed ? "🎉" : "💪"}</p>
          <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {result.passed ? "You Passed!" : "Keep Going!"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {result.passed ? "Our team will reach out for the next round." : "You can retry — review the basics and try again."}
          </p>
          <div className="mt-6 inline-flex items-baseline gap-1">
            <span className="text-5xl font-black text-indigo-600 dark:text-indigo-300">{result.total_score}</span>
            <span className="text-xl text-slate-400">%</span>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          {Object.entries(result.section_scores).map(([sec, sc]) => (
            <div key={sec}>
              <div className="flex justify-between text-xs"><span className="capitalize font-medium text-slate-700 dark:text-slate-300">{sec}</span><span className="font-bold">{sc}%</span></div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full rounded-full ${sc >= 60 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${sc}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] text-slate-400">Trust score: {result.trust_score}% · This window can be closed.</p>
      </Shell>
    );
  }

  // ── Test in progress ──
  const q = questions[idx];
  if (!q) return <Shell><p className="py-10 text-center text-sm text-slate-500">…</p></Shell>;
  const danger = timeLeft <= 5;

  return (
    <Shell wide>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">Question {idx + 1} / {questions.length}</span>
        <div className="flex items-center gap-3">
          {warnings > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              ⚠️ {warnings}/{MAX_WARNINGS} warnings
            </span>
          )}
          <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black tabular-nums ${danger ? "bg-rose-500 text-white" : "bg-slate-900 text-white dark:bg-indigo-600"}`}>
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((idx) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="mt-6">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase capitalize text-slate-500 dark:bg-slate-800">{q.section}</span>
        <p className="mt-3 select-none text-base font-bold text-slate-900 dark:text-white">{q.question}</p>
        <div className="mt-4 space-y-2">
          {q.options.map((o, oi) => {
            const sel = answers[q.id] === oi;
            return (
              <button key={oi} type="button" onClick={() => choose(q.id, oi)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${sel ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${sel ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-400"}`}>{String.fromCharCode(65 + oi)}</span>
                <span className="select-none text-slate-800 dark:text-slate-200">{o}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={next} className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500">
        {idx + 1 >= questions.length ? "Finish Test" : "Next Question →"}
      </button>
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0b0d12] dark:to-[#0e1117]">
      <div className={`mx-auto px-5 py-12 ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#11141a]">
          {children}
        </div>
      </div>
    </main>
  );
}
