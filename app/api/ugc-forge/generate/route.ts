// ============================================================
// /api/ugc-forge/generate  — HARDENED (Pillar 5)
// ============================================================
// Previously: forwarded the entire request body straight to n8n
// with zero auth, validation or rate-limiting. Anyone could
// curl this endpoint to burn AI budget.
//
// Now:
//   1. Require Authorization: Bearer <jwt>; reject 401 otherwise.
//   2. Validate every image URL (must be AgentForge-hosted) so
//      n8n can't be tricked into pulling from attacker URLs.
//   3. Stamp the body with the JWT-verified user_id (overrides
//      whatever the client sent) before forwarding.
// ============================================================

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { isAgentForgeHostedUrl } from "@/lib/uploadValidation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // 1. Auth.
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  const webhookUrl = process.env.N8N_UGC_FORGE_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_UGC_FORGE_WEBHOOK_URL is missing" },
      { status: 500 },
    );
  }

  // 2. Parse + validate body.
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isAgentForgeHostedUrl(body?.creator_image_url)) {
    return NextResponse.json(
      { error: "creator_image_url must be an AgentForge-hosted URL." },
      { status: 400 },
    );
  }
  if (!isAgentForgeHostedUrl(body?.product_image_url)) {
    return NextResponse.json(
      { error: "product_image_url must be an AgentForge-hosted URL." },
      { status: 400 },
    );
  }
  if (typeof body?.generation_id !== "string" || body.generation_id.length < 8) {
    return NextResponse.json(
      { error: "generation_id missing." },
      { status: 400 },
    );
  }

  // 3. Stamp verified user_id so n8n can attribute the call,
  // even if the client never sent one (or lied about it).
  const forwarded = { ...body, user_id: user.id };

  // 4. Forward.
  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwarded),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "n8n unreachable." },
      { status: 502 },
    );
  }

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: data?.error || "n8n webhook failed", details: data },
      { status: response.status },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "n8n returned empty response", status: response.status },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
