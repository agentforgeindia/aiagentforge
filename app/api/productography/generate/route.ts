// ============================================================
// /api/productography/generate  — HARDENED (Pillar 5)
// ============================================================
// Mirrors /api/textile/generate. The browser no longer touches
// the productography n8n webhook directly. This route:
//   1. Verifies the JWT (Authorization: Bearer …).
//   2. Validates URL inputs (must be AgentForge-hosted).
//   3. Inserts the generations row server-side with the verified
//      user_id (so a lying client can't bill another user).
//   4. Forwards to n8n, replacing user_id with the verified one.
//
// Credit deduction stays in the n8n workflow (calls the
// deduct_credits() RPC via service role). If you ever move it
// out, copy the jewellery pattern.
// ============================================================

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/serverAuth";
import { isAgentForgeHostedUrl } from "@/lib/uploadValidation";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-side webhook URL — prefer the private env var; accept
// the legacy NEXT_PUBLIC_* during migration.
const webhookUrl =
  process.env.N8N_PRODUCTOGRAPHY_WEBHOOK_URL ||
  process.env.NEXT_PUBLIC_N8N_PRODUCTOGRAPHY_WEBHOOK_URL;

const MAX_CREDITS_PER_CALL = 1_000;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isUuidish(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f-]{32,40}$/i.test(s);
}

async function insertGenerationRow(row: {
  id: string;
  user_id: string;
  design_url: string;
  product_type?: string;
  model_type?: string;
  shoot_style?: string;
  output_size?: string;
  quality?: string;
  article_number?: string | null;
  custom_instruction?: string | null;
}) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service-role env vars missing.");
  }
  const response = await fetch(`${supabaseUrl}/rest/v1/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify([
      {
        ...row,
        input_image_url: row.design_url,
        status: "pending",
        agent_type: "productography",
        category: "productography",
      },
    ]),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`generations insert failed: ${text}`);
  }
}

export async function POST(request: Request) {
  const userOrResp = await requireUser(request);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  if (!webhookUrl || !/^https?:\/\//i.test(webhookUrl)) {
    return bad(
      "Productography webhook URL is not configured. Set N8N_PRODUCTOGRAPHY_WEBHOOK_URL.",
      500,
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  if (!isUuidish(body?.generation_id)) {
    return bad("generation_id missing / not a UUID.");
  }
  if (!isAgentForgeHostedUrl(body?.design_url)) {
    return bad("design_url must be an AgentForge-hosted URL.");
  }

  const credits = Number(body?.required_credits ?? body?.credits_required ?? 0);
  if (!Number.isFinite(credits) || credits < 0 || credits > MAX_CREDITS_PER_CALL) {
    return bad(
      `required_credits must be a non-negative integer ≤ ${MAX_CREDITS_PER_CALL}.`,
    );
  }

  try {
    await insertGenerationRow({
      id: body.generation_id,
      user_id: user.id,
      design_url: body.design_url,
      product_type: body.product_category ?? body.product_type,
      model_type: body.model_look ?? body.model_type,
      shoot_style: body.shoot_style,
      output_size: body.output_size,
      quality: body.quality,
      article_number: body.product_code ?? body.article_number ?? null,
      custom_instruction: body.custom_instruction ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to register generation." },
      { status: 500 },
    );
  }

  const forwarded = { ...body, user_id: user.id, agent_type: "productography" };

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwarded),
      cache: "no-store",
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
      {
        error:
          data?.error || data?.message || `n8n error ${response.status}`,
        details: data,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    success: true,
    generation_id: body.generation_id,
    webhook_response: data,
  });
}
