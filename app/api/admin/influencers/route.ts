// GET /api/admin/influencers — list all influencers with stats
// POST /api/admin/influencers/scripts — create a script
// Admin-only (checks admin_users table)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function isAdmin(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const { data } = await db.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  const { data: row } = await db.from("admin_users").select("email").eq("email", email).maybeSingle();
  return row ? email : null;
}

export async function GET(req: Request) {
  const email = await isAdmin(req.headers.get("authorization"));
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: influencers } = await db
    .from("v_admin_influencers")
    .select("*");

  const { data: scripts } = await db
    .from("influencer_scripts")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: pendingVideos } = await db
    .from("influencer_video_submissions")
    .select("id, candidate_id, script_id, video_url, platform, caption, status, admin_note, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return NextResponse.json({
    ok: true,
    influencers: influencers ?? [],
    scripts: scripts ?? [],
    pending_videos: pendingVideos ?? [],
  });
}
