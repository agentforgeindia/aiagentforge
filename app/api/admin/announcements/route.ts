// /api/admin/announcements — list / create / delete announcements.
// Admin-only (service role).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  const { data } = await db.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await db
    .from("admin_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  return !!row;
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

export async function DELETE(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await db.from("announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
