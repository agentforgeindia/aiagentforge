// GET /api/admin/influencers — list all influencers with stats
// POST /api/admin/influencers/scripts — create a script
// Admin-only (checks admin_users table)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminFromAuthHeader, type PermissionSpec } from "@/lib/adminAuth";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Valid login + ACTIVE admin + the permission for this screen/action
// (lib/adminAuth.ts). Being listed in admin_users alone is not enough.
async function isAdmin(
  authHeader: string | null,
  perm: PermissionSpec = "marketing.view",
): Promise<string | null> {
  return (await adminFromAuthHeader(authHeader, perm))?.email ?? null;
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
