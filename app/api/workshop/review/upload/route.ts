// POST /api/workshop/review/upload  (PUBLIC)
// Uploads a review logo/photo to storage via the service role, so anon
// attendees can attach images without depending on bucket RLS policies.
// Returns a public URL.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "designs"; // existing public bucket
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"]);

function rid() {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  const kind = String(form.get("kind") || "photo") === "logo" ? "logo" : "photo";
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (!ALLOWED.has(file.type))
    return NextResponse.json({ error: "Only JPG, PNG, WebP or AVIF images are allowed." }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES)
    return NextResponse.json({ error: "Image must be 6 MB or smaller." }, { status: 400 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").slice(-60);
  const path = `workshop-reviews/${kind}/${Date.now()}-${rid()}-${safe}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, bytes, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ ok: true, url });
}
