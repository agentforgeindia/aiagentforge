// POST /api/admin/ai/coach
// AI Sales Coach — analyse a call transcript/notes and give the
// rep actionable feedback: what went well, what to improve,
// objection handling, and a score.

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
  const { transcript, rep } = await req.json().catch(() => ({}));
  if (!transcript || typeof transcript !== "string" || transcript.trim().length < 20) {
    return NextResponse.json({ error: "Paste the call transcript or notes." }, { status: 400 });
  }

  const result = await callLLM({
    system:
      "You are an expert sales coach for AgentForge (Indian AI SaaS — textile/jewellery/product photo AI; plans Starter ₹1,999, Pro ₹9,999, Empire ₹39,999). " +
      "Analyse the rep's call and coach them directly and kindly. Use simple Hinglish where natural. Output Markdown with these sections: " +
      "**Overall Score** (out of 10 with one-line reason), **What Went Well** (bullets), **What To Improve** (bullets), " +
      "**Objection Handling** (how they handled objections + better lines to use), **Recommended Next Action**, " +
      "**One Power Tip** (a single high-impact coaching tip).",
    user: `${rep ? `Sales rep: ${rep}\n\n` : ""}Call transcript / notes:\n\n${transcript.slice(0, 12000)}`,
    maxTokens: 900,
    temperature: 0.4,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, feedback: result.text, provider: result.provider });
}
