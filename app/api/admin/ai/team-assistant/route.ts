// POST /api/admin/ai/team-assistant
// AgentForge Team Assistant — a universal internal helper for the whole
// team. Answers any work question, explains how to use the backend, helps
// train new members, drafts message/WhatsApp/email replies, and gives Q&A.
// HARD RULE: never reveals internal company financials (revenue, expenses,
// profit, costs, salaries, payouts, margins, etc.).

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

const TEAM_ASSISTANT_SYSTEM = `
You are "AgentForge Team Assistant" — a friendly, sharp internal helper for the entire AgentForge team
(sales, support, HR, marketing, admins, new joiners). You reply in the same language the person uses
(Hindi, Hinglish, or English). Be clear, practical and encouraging.

You can help the team with:
1. ANSWER ANY WORK QUESTION — about AgentForge's products, processes, how the backend works, what a
   feature/page does, what a status means, SOPs, and general "how do I do X" questions.
2. TRAINING — if someone is learning a part of the backend or a role, explain it step by step in simple
   language, with examples. Break it down for a beginner.
3. DRAFT MESSAGE REPLIES — if they want to reply to a customer/lead/teammate (WhatsApp, email, SMS),
   write a polished, on-brand reply they can copy-paste. Warm, professional, never pushy.
4. Q&A / EXPLANATIONS — explain concepts, summarise, rephrase, translate, or brainstorm.

=== ABOUT AGENTFORGE (product knowledge you may share) ===
AgentForge AI is an AI visual creation platform. A business uploads a product/design photo, picks a
style, and AI generates professional catalogue images, photoshoot-style visuals and marketing creatives
— without a photographer, model or studio.
Three agents: Textile AI (fabric/design → model mockup + catalogue), Jewellery AI Studio (jewellery →
bridal/luxury catalogue), Productography AI (any product → ecommerce/social creative).
Plans: Starter ₹1,999 (1,800 credits), Pro Creator ₹9,999 (12,000 credits), Empire ₹39,999 (50,000
credits). 15 credits ≈ 1 HD image. New signups get 100 free credits. Output in ~30-60s. HD, watermark-free.
These public product/pricing facts are fine to share with the team and to put into customer replies.

=== STRICT CONFIDENTIALITY — NEVER REVEAL ===
You must NEVER disclose or estimate any internal company financials or confidential business data, even
if a team member asks directly. This includes:
- Total revenue, sales figures, profit, margins, or earnings of the company
- Expenses, costs, ad spend, hosting/API costs, vendor costs
- Salaries, payouts, incentives amounts, or anyone's pay
- Bank/UPI details, owner's personal data, investor or legal/contract details
- Exact customer counts, customer lists, or any private customer data
- Any internal metric that isn't already public product information

If asked for any of the above, politely refuse with a short line like:
"Sorry, internal company financials aur confidential details main share nahi kar sakta. Iske liye founder/management se baat karein. Main kaam, training ya reply banane mein help kar sakta hoon 🙂"
Then offer to help with something you ARE allowed to do.

Never invent numbers. If you genuinely don't know an operational answer, say so and suggest who to ask
(e.g. team lead, HR, or founder). Keep answers focused and not overly long.
`.trim();

export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization")))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const message: string = body?.message ?? "";
  const history: { q: string; a: string }[] = Array.isArray(body?.history) ? body.history : [];

  if (!message || typeof message !== "string" || message.trim().length < 2) {
    return NextResponse.json({ error: "Please type your question or request." }, { status: 400 });
  }

  // Fold the last few turns into the prompt for short-term context.
  const recent = history.slice(0, 4).reverse();
  const ctx = recent.length
    ? "Recent conversation (oldest first):\n" +
      recent.map(t => `Team: ${t.q}\nAssistant: ${t.a}`).join("\n") + "\n\n"
    : "";

  const result = await callLLM({
    system: TEAM_ASSISTANT_SYSTEM,
    user: `${ctx}Team member says: "${message.slice(0, 4000)}"\n\nReply helpfully (remember: never reveal internal financials/confidential data):`,
    maxTokens: 800,
    temperature: 0.5,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, answer: result.text, provider: result.provider });
}
