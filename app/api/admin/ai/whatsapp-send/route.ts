// POST /api/admin/ai/whatsapp-send
// Admin manually sends a WhatsApp reply to a customer (used when
// auto-reply is off — human reviews the AI draft, then sends).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { adminFromAuthHeader, type PermissionSpec } from "@/lib/adminAuth";

export const runtime = "nodejs";

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Valid login + ACTIVE admin + the permission for this screen/action
// (lib/adminAuth.ts). Being listed in admin_users alone is not enough.
async function isAdmin(
  authHeader: string | null,
  perm: PermissionSpec = "support.view",
): Promise<{ ok: boolean; email?: string }> {
  const caller = await adminFromAuthHeader(authHeader, perm);
  return caller ? { ok: true, email: caller.email } : { ok: false };
}

export async function POST(req: Request) {
  const auth = await isAdmin(req.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { to, body } = await req.json().catch(() => ({}));
  if (!to || !body) return NextResponse.json({ error: "to and body required" }, { status: 400 });

  const sent = await sendWhatsAppText(to, body);
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 502 });

  const db = svc();
  await db.from("whatsapp_messages").insert({
    wa_from: to, direction: "out", body, reply_sent: true,
    auto_sent: false, wa_message_id: sent.id,
  });

  return NextResponse.json({ ok: true, id: sent.id });
}
