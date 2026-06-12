// POST /api/demo-request  (PUBLIC)
// Visitor books a "Customize Demo": uploads a design (+ optional logo),
// picks an agent + desired output + WhatsApp number. We upload the files
// (service role, so non-logged-in visitors work), store the request, and
// open a support task (type = 'demo').

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB per file
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function rand() {
  return Math.random().toString(36).slice(2, 8);
}

async function uploadFile(file: File, prefix: string): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("File too large (max 12 MB).");
  if (file.type && !ALLOWED.includes(file.type)) throw new Error("Only PNG/JPG/WEBP images allowed.");
  const safe = (file.name || "upload").replace(/[^a-zA-Z0-9.-]/g, "-").slice(-40);
  const path = `demo-requests/${prefix}-${Date.now()}-${rand()}-${safe}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await db.storage.from("designs").upload(path, bytes, {
    contentType: file.type || "image/png",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return db.storage.from("designs").getPublicUrl(path).data.publicUrl;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const agent = String(form.get("agent") || "").trim();
    const whatsapp = String(form.get("whatsapp") || "").trim();
    const outputDesc = String(form.get("output_desc") || "").trim();
    const outputSize = String(form.get("output_size") || "").trim();
    const quality = String(form.get("quality") || "").trim();
    const device = String(form.get("device") || "").trim();
    const design = form.get("design");
    const logo = form.get("logo");

    // ── Validation ──
    if (!agent) return NextResponse.json({ error: "Please select an agent." }, { status: 400 });
    const digits = whatsapp.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15)
      return NextResponse.json({ error: "Please enter a valid WhatsApp number." }, { status: 400 });
    if (!(design instanceof File) || design.size === 0)
      return NextResponse.json({ error: "Please upload your design image." }, { status: 400 });

    // ── Uploads ──
    const designUrl = await uploadFile(design, "design");
    let logoUrl: string | null = null;
    if (logo instanceof File && logo.size > 0) {
      logoUrl = await uploadFile(logo, "logo");
    }

    // ── Support task (type = 'demo') ──
    const description = [
      `WhatsApp: ${whatsapp}`,
      `Agent: ${agent}`,
      outputDesc ? `Desired output: ${outputDesc}` : "",
      `Device: ${device || "—"} | Size: ${outputSize || "—"} | Quality: ${quality || "—"}`,
      `Design: ${designUrl}`,
      logoUrl ? `Logo: ${logoUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { data: task } = await db
      .from("tasks")
      .insert({
        title: `Customize demo — ${agent}`,
        description,
        type: "demo",
        status: "pending",
        priority: "high",
      })
      .select("id")
      .single();

    // ── Store the request ──
    const { error } = await db.from("demo_requests").insert({
      agent,
      output_desc: outputDesc || null,
      output_size: outputSize || null,
      quality: quality || null,
      device: device || null,
      whatsapp,
      design_url: designUrl,
      logo_url: logoUrl,
      task_id: task?.id ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not submit. Please try again." }, { status: 400 });
  }
}
