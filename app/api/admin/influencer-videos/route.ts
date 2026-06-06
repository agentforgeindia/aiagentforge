// PATCH /api/admin/influencer-videos — approve or reject a video submission

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

export async function PATCH(req: Request) {
  const email = await isAdmin(req.headers.get("authorization"));
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status, admin_note } = await req.json().catch(() => ({}));
  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "id and status (approved|rejected) required" }, { status: 400 });
  }

  const { error } = await db
    .from("influencer_video_submissions")
    .update({ status, admin_note: admin_note || null, reviewed_by: email, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
