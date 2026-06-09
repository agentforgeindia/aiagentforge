// POST /api/careers/test-start  (PUBLIC)
// Called when candidate opens the test page.
// Sets stage → "test_started" and also marks training_done if not already past it.

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

// Only advance if candidate is in a pre-test stage
const PRE_TEST_STAGES = ["applied", "training_started", "training_done"];

export async function POST(req: Request) {
  const { candidate_id } = await req.json().catch(() => ({}));
  if (!candidate_id) return NextResponse.json({ ok: false });

  const db = svc();

  // Fetch current stage
  const { data: c } = await db
    .from("candidates")
    .select("stage")
    .eq("id", candidate_id)
    .maybeSingle();

  if (!c) return NextResponse.json({ ok: false, error: "Candidate not found" });

  // Only update if they haven't already passed the test
  if (PRE_TEST_STAGES.includes(c.stage)) {
    await db.from("candidates")
      .update({ stage: "test_started", updated_at: new Date().toISOString() })
      .eq("id", candidate_id);
  }

  return NextResponse.json({ ok: true });
}
