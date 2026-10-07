// POST /api/admin/influencer-scripts — create a new script
// DELETE /api/admin/influencer-scripts?id=UUID — archive a script

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

export async function POST(req: Request) {
  const email = await isAdmin(req.headers.get("authorization"));
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, script_text, video_ref } = await req.json().catch(() => ({}));
  if (!title || !script_text) {
    return NextResponse.json({ error: "title and script_text are required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("influencer_scripts")
    .insert({ title, description, script_text, video_ref: video_ref || null, status: "active", created_by: email })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(req: Request) {
  const email = await isAdmin(req.headers.get("authorization"));
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.from("influencer_scripts").update({ status: "archived" }).eq("id", id);
  return NextResponse.json({ ok: true });
}
