// PATCH /api/admin/influencer-videos — approve or reject a video submission

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
