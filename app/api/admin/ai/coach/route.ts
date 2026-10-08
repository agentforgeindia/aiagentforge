// POST /api/admin/ai/coach
// AI Sales Coach — analyse a call transcript/notes and give the
// rep actionable feedback: what went well, what to improve,
// objection handling, and a score.

import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { adminFromAuthHeader, type PermissionSpec } from "@/lib/adminAuth";

export const runtime = "nodejs";

// Valid login + ACTIVE admin + the permission for this screen/action
// (lib/adminAuth.ts). Being listed in admin_users alone is not enough.
async function isAdmin(
  authHeader: string | null,
  perm: PermissionSpec = "any",
): Promise<boolean> {
  return Boolean(await adminFromAuthHeader(authHeader, perm));
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
