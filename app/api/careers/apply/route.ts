// POST /api/careers/apply  (PUBLIC)
// Candidate applies. Find-or-create by mobile so they keep their
// attempts. Returns candidate id + remaining attempts.

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

const MAX_ATTEMPTS = 3;

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  const mobile = String(b.mobile ?? "").replace(/[^\d+]/g, "");
  if (!name || mobile.length < 8) {
    return NextResponse.json({ error: "Name and a valid mobile number are required." }, { status: 400 });
  }

  const db = svc();

  // Find existing by mobile
  const { data: existing } = await db.from("candidates").select("id, stage").eq("mobile", mobile).maybeSingle();

  let candidateId: string;
  if (existing) {
    candidateId = existing.id;
    // update profile fields (non-destructive)
    await db.from("candidates").update({
      name, email: b.email || null, city: b.city || null, state: b.state || null,
      linkedin: b.linkedin || null, portfolio: b.portfolio || null,
      role_slug: b.role_slug || null, updated_at: new Date().toISOString(),
    }).eq("id", candidateId);
  } else {
    const { data: created, error } = await db.from("candidates").insert({
      name, mobile, email: b.email || null, city: b.city || null, state: b.state || null,
      linkedin: b.linkedin || null, portfolio: b.portfolio || null,
      role_slug: b.role_slug || null, source: "portal", stage: "applied",
    }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    candidateId = created.id;
  }

  // Attempts used
  const { count } = await db.from("assessment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidateId);
  const used = count ?? 0;

  return NextResponse.json({
    ok: true,
    candidate_id: candidateId,
    attempts_used: used,
    attempts_left: Math.max(0, MAX_ATTEMPTS - used),
    locked: used >= MAX_ATTEMPTS,
  });
}
