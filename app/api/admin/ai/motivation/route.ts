// GET /api/admin/ai/motivation — AI morning motivation "by Founder".
// Personalised from the member's stats + birthday + achievements.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callLLM } from "@/lib/llm";

export const runtime = "nodejs";

async function getContext(token: string): Promise<{ ok: boolean; ctx?: any }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false };
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: u } = await admin.auth.getUser(token);
  const email = u.user?.email?.toLowerCase();
  if (!email) return { ok: false };
  const { data: row } = await admin.from("admin_users").select("email").eq("email", email).maybeSingle();
  if (!row) return { ok: false };
  // Build context via an admin-scoped client using the user's token
  const userClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: ctx } = await userClient.rpc("motivation_context");
  return { ok: true, ctx: ctx ?? { name: email.split("@")[0] } };
}

export async function GET(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(header.trim())?.[1]?.trim();
  if (!token) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ok, ctx } = await getContext(token);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const name = ctx?.name ?? "team";
  const sales = ctx?.sales_month ?? 0;
  const bday = ctx?.is_birthday === true;
  const achiever = ctx?.is_daily_achiever === true;
  const role = ctx?.role ?? "team";

  const result = await callLLM({
    system:
      "You are the Founder of AgentForge (an Indian AI image-generation startup) writing a SHORT, warm, " +
      "energising morning message to a team member. Write in friendly Hinglish, 2-3 lines max. Be genuine, " +
      "not cheesy. Sign off as '— Founder, AgentForge'. " +
      (bday ? "It is this person's BIRTHDAY today — lead with a warm birthday wish 🎂. " : "") +
      (achiever ? "They were yesterday's TOP performer — congratulate them 🏆. " : ""),
    user:
      `Team member: ${name}\nRole: ${role}\nSales this month: ${sales}\n` +
      `Birthday today: ${bday}\nTop achiever: ${achiever}\n\nWrite their morning motivation:`,
    maxTokens: 220,
    temperature: 0.8,
  });

  const fallback = bday
    ? `Happy Birthday ${name}! 🎂 Aapka din shaandaar ho — team aapke saath hai. Aaj ka target bhi crack karenge! — Founder, AgentForge`
    : `Good morning ${name}! 💪 Aaj ek naya din, ek naya mauka. Chalo aaj kuch badhiya karte hain! — Founder, AgentForge`;

  return NextResponse.json({
    ok: true,
    message: result.ok ? result.text : fallback,
    birthday: bday,
    achiever,
  });
}
