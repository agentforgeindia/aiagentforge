// POST /api/careers/influencer/video-submit
// Influencer submits a video ad for a script

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(req: Request) {
  const { candidate_id, script_id, video_url, platform, caption } = await req.json().catch(() => ({}));

  if (!candidate_id || !video_url) {
    return NextResponse.json({ ok: false, error: "candidate_id and video_url are required" }, { status: 400 });
  }

  // Verify this is a CC candidate
  const { data: cand } = await db
    .from("candidates")
    .select("id, role_slug")
    .eq("id", candidate_id)
    .eq("role_slug", "content-creator")
    .maybeSingle();

  if (!cand) return NextResponse.json({ ok: false, error: "Candidate not found" }, { status: 404 });

  const { data, error } = await db
    .from("influencer_video_submissions")
    .insert({ candidate_id, script_id: script_id || null, video_url, platform, caption, status: "pending" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, submission_id: data.id });
}
