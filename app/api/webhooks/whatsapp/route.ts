// ============================================================
// WhatsApp Business Cloud API webhook
// ============================================================
//   GET  → Meta verification handshake (hub.challenge)
//   POST → incoming customer messages
//
// Flow on POST:
//   1. Verify X-Hub-Signature-256 (if WHATSAPP_APP_SECRET set)
//   2. Store inbound message in whatsapp_messages
//   3. Generate an AI reply draft (lib/llm)
//   4. If WHATSAPP_AUTO_REPLY=true → send it + store outbound
//      else → just save the draft for human review in the inbox
//
// Meta setup:
//   Webhook URL : https://aiagentforge.in/api/webhooks/whatsapp
//   Verify token: value of WHATSAPP_VERIFY_TOKEN
//   Subscribe to: messages
// ============================================================

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { callLLM } from "@/lib/llm";
import { sendWhatsAppText, whatsappAutoReplyEnabled } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const WA_SYSTEM =
  "You are AgentForge's WhatsApp support assistant for Indian SMB customers (textile sellers, jewellers, product sellers). " +
  "AgentForge turns product photos into catalogue-ready AI shoots in ~60 seconds. Plans: Starter ₹1,999 (1,800 credits), " +
  "Pro ₹9,999 (12,000 credits), Empire ₹39,999 (50,000 credits). 15 credits = 1 HD image. New users get 100 free credits. " +
  "Reply in the SAME language the customer used (Hindi/English/Hinglish). Warm, short (2-5 lines), WhatsApp-style with light emoji. " +
  "Give relevant plan if asked price; be empathetic on complaints; never invent features; end with a gentle next step.";

// ── GET: verification handshake ──────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && token === expected) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function verifySignature(rawBody: string, sig: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // signature check optional if not configured
  if (!sig) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ── POST: incoming messages ──────────────────────────────────
export async function POST(req: Request) {
  let raw: string;
  try { raw = await req.text(); } catch { return NextResponse.json({ ok: true }); }

  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

  let db: SupabaseClient;
  try { db = admin(); } catch { return NextResponse.json({ ok: true }); }

  const autoReply = whatsappAutoReplyEnabled();

  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value ?? {};
      const contacts = value?.contacts ?? [];
      const name = contacts?.[0]?.profile?.name ?? null;

      for (const msg of value?.messages ?? []) {
        if (msg.type !== "text") continue;
        const from = msg.from as string;
        const text = msg.text?.body as string;
        if (!from || !text) continue;

        // 1) Store inbound
        const { data: inserted } = await db
          .from("whatsapp_messages")
          .insert({ wa_from: from, wa_name: name, direction: "in", body: text, wa_message_id: msg.id })
          .select("id")
          .single();

        // 2) AI draft (use recent history as light context)
        const { data: history } = await db
          .from("whatsapp_messages")
          .select("direction, body")
          .eq("wa_from", from)
          .order("created_at", { ascending: false })
          .limit(6);
        const ctx = (history ?? [])
          .reverse()
          .map((h) => `${h.direction === "in" ? "Customer" : "Us"}: ${h.body}`)
          .join("\n");

        const ai = await callLLM({
          system: WA_SYSTEM,
          user: `Recent conversation:\n${ctx}\n\nDraft our reply to the latest customer message:`,
          maxTokens: 400,
          temperature: 0.6,
        });
        const draft = ai.ok ? ai.text : null;

        // Save draft on the inbound row
        if (draft && inserted?.id) {
          await db.from("whatsapp_messages").update({ ai_reply: draft }).eq("id", inserted.id);
        }

        // 3) Auto-send if enabled
        if (autoReply && draft) {
          const sent = await sendWhatsAppText(from, draft);
          await db.from("whatsapp_messages").insert({
            wa_from: from, wa_name: name, direction: "out", body: draft,
            reply_sent: sent.ok, auto_sent: true,
            wa_message_id: sent.ok ? sent.id : null,
          });
          if (inserted?.id) {
            await db.from("whatsapp_messages").update({ reply_sent: sent.ok }).eq("id", inserted.id);
          }
        }
      }
    }
  }

  // Meta requires a fast 200.
  return NextResponse.json({ ok: true });
}
