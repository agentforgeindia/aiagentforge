// POST /api/admin/ai/whatsapp-reply
// WhatsApp AI Assistant — given an incoming customer message
// (and optional context), draft a helpful WhatsApp reply in the
// customer's language/tone. Also usable as the engine behind a
// real WhatsApp Business webhook later.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callLLM } from "@/lib/llm";

export const runtime = "nodejs";

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await admin.from("admin_users").select("email").eq("email", email).maybeSingle();
  return Boolean(row);
}

export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization")))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { message, context } = await req.json().catch(() => ({}));
  if (!message || typeof message !== "string" || message.trim().length < 2) {
    return NextResponse.json({ error: "Enter the customer's message." }, { status: 400 });
  }

  const result = await callLLM({
    system:
      "You are AgentForge's WhatsApp support assistant for Indian SMB customers (textile sellers, jewellers, product sellers). " +
      "AgentForge turns product photos into catalogue-ready AI shoots in ~60 seconds. Plans: Starter ₹1,999 (1,800 credits), " +
      "Pro ₹9,999 (12,000 credits), Empire ₹39,999 (50,000 credits). 15 credits = 1 HD image. New users get 100 free credits. " +
      "Reply in the SAME language the customer used (Hindi/English/Hinglish). Keep it warm, short (2-5 lines), WhatsApp-style with light emoji. " +
      "If they ask price, give the relevant plan. If a complaint, be empathetic and offer to help/escalate. Never invent features. " +
      "End with a gentle next step (e.g. 'try free' or 'main demo bhej du?').",
    user: `${context ? `Context about this customer: ${context}\n\n` : ""}Customer's WhatsApp message:\n"${message.slice(0, 4000)}"\n\nDraft the reply:`,
    maxTokens: 400,
    temperature: 0.6,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, reply: result.text, provider: result.provider });
}
