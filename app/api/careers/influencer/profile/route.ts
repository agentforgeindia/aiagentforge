import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/careers/influencer/profile
// Body: { cid, bio, instagram_url, youtube_url, twitter_url, tiktok_url, website_url, profile_photo_url }
export async function PATCH(req: NextRequest) {
  try {
    const { cid, bio, instagram_url, youtube_url, twitter_url, tiktok_url, website_url, profile_photo_url } = await req.json();
    if (!cid) return NextResponse.json({ ok: false, error: "Missing cid." }, { status: 400 });

    const { error } = await admin
      .from("content_creator_social")
      .update({ bio, instagram_url, youtube_url, twitter_url, tiktok_url, website_url, profile_photo_url })
      .eq("candidate_id", cid);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error." }, { status: 500 });
  }
}
