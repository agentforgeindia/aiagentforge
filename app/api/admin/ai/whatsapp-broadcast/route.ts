// POST /api/admin/ai/whatsapp-broadcast
// Sends a WhatsApp broadcast to leads / customers / custom list.
// NOTE: business-initiated WhatsApp messages outside the 24h window
// require Meta-approved message templates. This route sends plain
// text (works for opted-in / within-window contacts). For large
// cold broadcasts, switch to template messages in lib/whatsapp.

import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function isAdmin(authHeader: string | null): Promise<{ ok: boolean; id?: string }> {
  if (!authHeader?.startsWith("Bearer ")) return { ok: false };
  const token = authHeader.slice(7).trim();
  const admin = svc();
  const { data } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return { ok: false };
  const { data: row } = await admin.from("admin_users").select("email").eq("email", email).maybeSingle();
  return { ok: Boolean(row), id: data.user?.id };
}

export async function POST(req: Request) {
  const auth = await isAdmin(req.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, message, audience, custom } = await req.json().catch(() => ({}));
  if (!title || !message) return NextResponse.json({ error: "title and message required" }, { status: 400 });

  const db = svc();

  // Resolve recipients
  let phones: string[] = [];
  if (audience === "custom" && Array.isArray(custom)) {
    phones = custom.map((p: string) => String(p).replace(/[^\d+]/g, "")).filter(Boolean);
  } else if (audience === "customers") {
    const { data } = await db.from("profiles").select("phone").not("phone", "is", null);
    phones = (data ?? []).map((r: any) => String(r.phone).replace(/[^\d+]/g, "")).filter(Boolean);
  } else {
    // leads (default)
    const { data } = await db.from("leads").select("phone").not("phone", "is", null);
    phones = (data ?? []).map((r: any) => String(r.phone).replace(/[^\d+]/g, "")).filter(Boolean);
  }
  // Dedupe
  phones = Array.from(new Set(phones));

  if (phones.length === 0) {
    return NextResponse.json({ error: "No recipients with phone numbers found." }, { status: 400 });
  }

  // Create broadcast record
  const { data: bcast } = await db.from("whatsapp_broadcasts").insert({
    title, message, audience: audience ?? "leads",
    recipients: phones, total: phones.length, status: "sending",
    created_by: auth.id,
  }).select("id").single();

  // Send (cap at 200 per call to stay safe)
  let sent = 0, failed = 0;
  for (const to of phones.slice(0, 200)) {
    const r = await sendWhatsAppText(to, message);
    if (r.ok) sent++; else failed++;
  }

  await db.from("whatsapp_broadcasts").update({
    sent_count: sent, failed_count: failed,
    status: failed === phones.length ? "failed" : "done",
    sent_at: new Date().toISOString(),
  }).eq("id", bcast?.id);

  return NextResponse.json({ ok: true, total: phones.length, sent, failed });
}
