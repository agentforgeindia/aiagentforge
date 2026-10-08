// /api/admin/announcements — list / create / pause-resume / delete
// announcements (the notifications in every user's bell).
// Admin-only (service role).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminFromAuthHeader, type PermissionSpec } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Valid login + ACTIVE admin + the permission for this screen/action
// (lib/adminAuth.ts). Being listed in admin_users alone is not enough.
async function isAdmin(
  authHeader: string | null,
  perm: PermissionSpec = "customers.view",
): Promise<boolean> {
  return Boolean(await adminFromAuthHeader(authHeader, perm));
}

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await db
    .from("announcements")
    .select("id, title, body, link, image_url, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Welcome-notification reach: how many users were sent the welcome,
  // and how many have actually opened it (is_read = true → seen).
  const [{ count: welcomeTotal }, { count: welcomeRead }, { count: signups }] =
    await Promise.all([
      db
        .from("user_notifications")
        .select("id", { count: "exact", head: true })
        .like("title", "Welcome to AgentForge%"),
      db
        .from("user_notifications")
        .select("id", { count: "exact", head: true })
        .like("title", "Welcome to AgentForge%")
        .eq("is_read", true),
      db.from("profiles").select("id", { count: "exact", head: true }),
    ]);

  return NextResponse.json({
    ok: true,
    announcements: data ?? [],
    welcomeStats: {
      signups: signups ?? 0,
      sent: welcomeTotal ?? 0,
      seen: welcomeRead ?? 0,
    },
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Accept multipart (image + fields) OR plain JSON (no image).
  let title = "", body = "", link = "", imageUrl: string | null = null;
  const ctype = req.headers.get("content-type") || "";

  if (ctype.includes("multipart/form-data")) {
    const form = await req.formData();
    title = String(form.get("title") || "");
    body = String(form.get("body") || "");
    link = String(form.get("link") || "");
    const file = form.get("image");
    if (file && file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024)
        return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `announcements/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await db.storage
        .from("post-images")
        .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });
      if (upErr)
        return NextResponse.json({ error: "Image upload failed: " + upErr.message }, { status: 500 });
      imageUrl = db.storage.from("post-images").getPublicUrl(path).data.publicUrl;
    }
  } else {
    const j = await req.json().catch(() => ({}));
    title = String(j.title || "");
    body = String(j.body || "");
    link = String(j.link || "");
    imageUrl = j.image_url ? String(j.image_url) : null;
  }

  if (!title.trim())
    return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const { error } = await db.from("announcements").insert({
    title: title.trim().slice(0, 160),
    body: body.trim() ? body.trim().slice(0, 1000) : null,
    link: link.trim() ? link.trim().slice(0, 500) : null,
    image_url: imageUrl,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Pause / resume — a paused notification is hidden from every bell
// but stays in this list (with its seen counts) and can be resumed.
export async function PATCH(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const j = (await req.json().catch(() => ({}))) as { id?: unknown; is_active?: unknown };
  const id = String(j.id || "");
  if (!id || typeof j.is_active !== "boolean")
    return NextResponse.json({ error: "id and is_active are required." }, { status: 400 });

  const { error } = await db.from("announcements").update({ is_active: j.is_active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await db.from("announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
