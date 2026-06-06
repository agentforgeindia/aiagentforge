import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/influencer-hub — public list of active influencers + their comments
export async function GET() {
  const { data: influencers } = await admin
    .from("v_influencer_hub")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: comments } = await admin
    .from("influencer_hub_comments")
    .select("id, influencer_candidate_id, commenter_name, comment_text, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, influencers: influencers ?? [], comments: comments ?? [] });
}

// POST /api/influencer-hub — post a comment
export async function POST(req: NextRequest) {
  try {
    const { influencer_candidate_id, commenter_name, comment_text } = await req.json();
    if (!influencer_candidate_id || !commenter_name?.trim() || !comment_text?.trim()) {
      return NextResponse.json({ ok: false, error: "Name and comment required." }, { status: 400 });
    }
    if (comment_text.length > 500) {
      return NextResponse.json({ ok: false, error: "Comment too long (max 500 chars)." }, { status: 400 });
    }

    const { error } = await admin.from("influencer_hub_comments").insert({
      influencer_candidate_id,
      commenter_name: commenter_name.trim().slice(0, 80),
      comment_text: comment_text.trim(),
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error." }, { status: 500 });
  }
}
