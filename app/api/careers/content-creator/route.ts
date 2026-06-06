// GET /api/careers/content-creator?candidate_id=UUID
// Returns AI analysis data for a content creator candidate.

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidate_id");
  if (!candidateId) return NextResponse.json({ ok: false, error: "candidate_id required" }, { status: 400 });

  const db = svc();
  const { data } = await db.from("content_creator_social")
    .select("ai_score, ai_verdict, referral_code, referral_status")
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (!data) return NextResponse.json({ ok: false, error: "No content creator data found" }, { status: 404 });

  return NextResponse.json({ ok: true, ...data });
}
