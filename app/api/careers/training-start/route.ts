// POST /api/careers/training-start  (PUBLIC)
// Marks candidate stage as training_started when they open the learn page.

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

export async function POST(req: Request) {
  const { candidate_id } = await req.json().catch(() => ({}));
  if (!candidate_id) return NextResponse.json({ ok: false });

  const db = svc();
  await db.from("candidates")
    .update({ stage: "training_started", updated_at: new Date().toISOString() })
    .eq("id", candidate_id)
    .eq("stage", "applied");

  return NextResponse.json({ ok: true });
}
