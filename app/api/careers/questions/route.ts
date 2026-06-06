// POST /api/careers/questions  (PUBLIC)
// Returns randomized questions for the candidate's role WITHOUT
// the correct answers (graded server-side later). Enforces the
// 3-attempt limit.

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

const MAX_ATTEMPTS    = 3;
const MAX_QUESTIONS   = 50;   // 50 questions × 2 marks = 100 total
const CC_MAX_QUESTIONS = 5;   // Content Creator: 5 basic AgentForge questions
const TIME_BY_DIFF: Record<string, number> = { easy: 30, medium: 45, hard: 60 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  const { candidate_id } = await req.json().catch(() => ({}));
  if (!candidate_id) return NextResponse.json({ error: "candidate_id required" }, { status: 400 });

  const db = svc();

  const { data: cand } = await db.from("candidates").select("id, role_slug").eq("id", candidate_id).maybeSingle();
  if (!cand) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  const { count } = await db.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("candidate_id", candidate_id);
  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Maximum 3 attempts reached. Test locked." }, { status: 403 });
  }

  // Content Creators: 5 role-specific AgentForge questions only
  // All other roles: role-specific + common questions, up to 50
  const isCC = cand.role_slug === "content-creator";

  let rawQs: any[] | null = null;
  if (isCC) {
    const { data } = await db.from("recruitment_questions")
      .select("id, section, difficulty, question, options")
      .eq("role_slug", "content-creator");
    rawQs = data;
  } else {
    const { data } = await db.from("recruitment_questions")
      .select("id, section, difficulty, question, options")
      .or(`role_slug.eq.${cand.role_slug},role_slug.is.null`);
    rawQs = data;
  }

  const qs = rawQs;
  if (!qs || qs.length === 0) {
    return NextResponse.json({ error: "No questions configured yet. Please check back later." }, { status: 400 });
  }

  const limit  = isCC ? CC_MAX_QUESTIONS : MAX_QUESTIONS;
  const picked = shuffle(qs).slice(0, limit).map((q: any) => ({
    id: q.id,
    section: q.section,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    time: TIME_BY_DIFF[q.difficulty] ?? 45,
  }));

  return NextResponse.json({
    ok: true,
    attempt_no: (count ?? 0) + 1,
    questions: picked,
  });
}
