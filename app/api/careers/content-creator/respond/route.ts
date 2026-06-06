// POST /api/careers/content-creator/respond  (PUBLIC)
// Saves the content creator's yes/no response to the referral proposal.

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
  const { candidate_id, response } = await req.json().catch(() => ({}));
  if (!candidate_id || !["yes","no"].includes(response)) {
    return NextResponse.json({ ok: false, error: "candidate_id and response (yes/no) required" }, { status: 400 });
  }

  const db = svc();
  await db.from("content_creator_social").update({
    candidate_response: response,
    referral_status: response === "yes" ? "accepted" : "declined",
  }).eq("candidate_id", candidate_id);

  // Notify social media manager of the response
  const { data: ccs } = await db.from("content_creator_social")
    .select("referral_code")
    .eq("candidate_id", candidate_id)
    .maybeSingle();

  try {
    await db.from("recruitment_notifications").insert({
      candidate_id,
      event_type: "content_creator_responded",
      details: { response, referral_code: ccs?.referral_code },
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
