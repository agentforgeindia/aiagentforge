// POST /api/careers/submit  (PUBLIC)
// Grades answers server-side, saves the attempt, updates the
// candidate's scores + pipeline stage + AI recommendation.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const PASS_THRESHOLD = 60; // %

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const candidateId: string = b.candidate_id;
  const answers: Record<string, number> = b.answers ?? {};   // {questionId: selectedIdx}
  const cheatFlags: number = Number(b.cheat_flags ?? 0);
  const durationSecs: number = Number(b.duration_secs ?? 0);

  if (!candidateId) return NextResponse.json({ error: "candidate_id required" }, { status: 400 });

  const db = svc();

  const qIds = Object.keys(answers);
  if (qIds.length === 0) return NextResponse.json({ error: "No answers submitted" }, { status: 400 });

  // Fetch correct answers for the submitted questions
  const { data: qs } = await db.from("recruitment_questions")
    .select("id, section, correct_idx")
    .in("id", qIds);

  const bySection: Record<string, { correct: number; total: number }> = {};
  let totalCorrect = 0, totalQ = 0;

  for (const q of qs ?? []) {
    const sec = q.section as string;
    bySection[sec] ??= { correct: 0, total: 0 };
    bySection[sec].total++;
    totalQ++;
    if (answers[q.id] === q.correct_idx) {
      bySection[sec].correct++;
      totalCorrect++;
    }
  }

  const sectionScores: Record<string, number> = {};
  for (const [sec, v] of Object.entries(bySection)) {
    sectionScores[sec] = v.total ? Math.round((v.correct / v.total) * 100) : 0;
  }
  const totalScore = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const passed = totalScore >= PASS_THRESHOLD && cheatFlags < 3;

  // Trust score: drops with cheat flags
  const trust = Math.max(0, 100 - cheatFlags * 20);

  // AI recommendation
  const aiRec = !passed ? "reject" : totalScore >= 80 && trust >= 80 ? "hire" : "hold";

  // Attempt number
  const { count } = await db.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("candidate_id", candidateId);
  const attemptNo = (count ?? 0) + 1;

  // Save attempt
  await db.from("assessment_attempts").insert({
    candidate_id: candidateId, attempt_no: attemptNo,
    section_scores: sectionScores, total_score: totalScore,
    passed, cheat_flags: cheatFlags, duration_secs: durationSecs,
  });

  // Update candidate
  await db.from("candidates").update({
    knowledge_score: sectionScores["basic"] ?? null,
    product_score:   sectionScores["product"] ?? null,
    crm_score:       sectionScores["crm"] ?? null,
    sales_score:     sectionScores["sales"] ?? null,
    trust_score:     trust,
    final_score:     totalScore,
    ai_recommendation: aiRec,
    stage: passed ? "passed" : "assessment_completed",
    updated_at: new Date().toISOString(),
  }).eq("id", candidateId);

  return NextResponse.json({
    ok: true,
    total_score: totalScore,
    section_scores: sectionScores,
    trust_score: trust,
    passed,
    recommendation: aiRec,
  });
}
