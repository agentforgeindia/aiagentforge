import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/influencer-hub — influencer profiles + approved video feed + reactions + comments
export async function GET() {
  const [infRes, feedRes, reactRes, vcRes, pcRes] = await Promise.all([
    admin.from("v_influencer_hub").select("*").order("created_at", { ascending: false }),
    admin.from("v_influencer_feed").select("*"),
    admin.from("influencer_video_reactions").select("video_id, reaction_type, user_key"),
    admin.from("influencer_video_comments").select("*").order("created_at", { ascending: true }),
    admin.from("influencer_hub_comments").select("*").order("created_at", { ascending: true }),
  ]);

  return NextResponse.json({
    ok: true,
    influencers: infRes.data ?? [],
    feed: feedRes.data ?? [],
    reactions: reactRes.data ?? [],
    video_comments: vcRes.data ?? [],
    profile_comments: pcRes.data ?? [],
  });
}

// POST /api/influencer-hub — profile comment OR video reaction OR video comment
// body: { type: "profile_comment" | "video_reaction" | "video_comment", ...fields }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === "profile_comment") {
      const { influencer_candidate_id, commenter_name, comment_text } = body;
      if (!influencer_candidate_id || !commenter_name?.trim() || !comment_text?.trim())
        return NextResponse.json({ ok: false, error: "Name and comment required." }, { status: 400 });
      const { error } = await admin.from("influencer_hub_comments").insert({
        influencer_candidate_id, commenter_name: commenter_name.trim().slice(0, 80),
        comment_text: comment_text.trim().slice(0, 500),
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (type === "video_reaction") {
      const { video_id, user_key, reaction_type } = body;
      if (!video_id || !user_key || !reaction_type)
        return NextResponse.json({ ok: false, error: "Missing fields." }, { status: 400 });

      // Check existing reaction
      const { data: existing } = await admin
        .from("influencer_video_reactions")
        .select("id, reaction_type")
        .eq("video_id", video_id).eq("user_key", user_key).single();

      if (existing) {
        if (existing.reaction_type === reaction_type) {
          // Toggle off
          await admin.from("influencer_video_reactions").delete().eq("id", existing.id);
          return NextResponse.json({ ok: true, action: "removed" });
        } else {
          // Change reaction
          await admin.from("influencer_video_reactions").update({ reaction_type }).eq("id", existing.id);
          return NextResponse.json({ ok: true, action: "changed" });
        }
      } else {
        await admin.from("influencer_video_reactions").insert({ video_id, user_key, reaction_type });
        return NextResponse.json({ ok: true, action: "added" });
      }
    }

    if (type === "video_comment") {
      const { video_id, commenter_name, comment_text } = body;
      if (!video_id || !commenter_name?.trim() || !comment_text?.trim())
        return NextResponse.json({ ok: false, error: "Name and comment required." }, { status: 400 });
      const { error } = await admin.from("influencer_video_comments").insert({
        video_id, commenter_name: commenter_name.trim().slice(0, 80),
        comment_text: comment_text.trim().slice(0, 500),
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown type." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error." }, { status: 500 });
  }
}
