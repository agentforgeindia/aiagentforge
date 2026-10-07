// POST /api/admin/ai/summary
// AI Meeting Summary — paste a call/meeting transcript, get a
// structured summary: key points, customer needs, objections,
// next steps, and a follow-up draft.

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
  const { transcript } = await req.json().catch(() => ({}));
  if (!transcript || typeof transcript !== "string" || transcript.trim().length < 20) {
    return NextResponse.json({ error: "Paste a transcript (at least a few lines)." }, { status: 400 });
  }

  const result = await callLLM({
    system:
      "You are an assistant for AgentForge, an Indian AI image-generation SaaS (textile, jewellery, product photography agents; plans Starter/Pro/Empire). " +
      "Summarise sales/support call transcripts crisply for the founder. Use simple language. Output in Markdown with these sections exactly: " +
      "**Summary** (2-3 lines), **Customer Need**, **Objections Raised**, **Sentiment** (Positive/Neutral/Negative), **Next Steps** (bullet list), **Suggested Follow-up Message** (a short WhatsApp-ready message).",
    user: `Transcript:\n\n${transcript.slice(0, 12000)}`,
    maxTokens: 900,
    temperature: 0.3,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, summary: result.text, provider: result.provider });
}
