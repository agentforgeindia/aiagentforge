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
import { isAgentEnabled } from "@/lib/agentEnabled";
import { isAgentForgeHostedUrl } from "@/lib/uploadValidation";
import { getTeamMembership } from "@/lib/teamAuth";
import { deductTeamCredits, refundTeamCredits } from "@/lib/creditsServer";

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
  team_id?: string | null;
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
        team_id: row.team_id ?? null,
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

  if (!(await isAgentEnabled("productography"))) {
    return NextResponse.json({ error: "Productography AI is temporarily disabled. Please try again later." }, { status: 403 });
  }

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

  // Resolve team context — if team_id present, deduct here (not in n8n).
  const teamId = typeof body?.team_id === "string" && body.team_id ? body.team_id : null;

  let teamDeducted = false;
  if (teamId && credits > 0) {
    const membership = await getTeamMembership(user.id, teamId);
    if (!membership) {
      return NextResponse.json({ error: "Team not found or you are not a member." }, { status: 403 });
    }

    const deduct = await deductTeamCredits(
      teamId, user.id, credits,
      "productography_generate", body.generation_id,
    );
    if (!deduct.ok) {
      if (deduct.reason === "insufficient") {
        return NextResponse.json(
          { error: "Not enough credits in team pool.", code: "INSUFFICIENT_CREDITS" },
          { status: 402 },
        );
      }
      return NextResponse.json({ error: deduct.message || "Credit deduction failed." }, { status: 500 });
    }
    teamDeducted = true;
  }

  try {
    await insertGenerationRow({
      id: body.generation_id,
      user_id: user.id,
      team_id: teamId,
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
    if (teamDeducted) {
      await refundTeamCredits(teamId!, user.id, credits, "refund:generation_row_insert_failed", body.generation_id);
    }
    return NextResponse.json(
      { error: err?.message || "Failed to register generation." },
      { status: 500 },
    );
  }

  const forwarded = {
    ...body,
    user_id: user.id,
    team_id: teamId ?? undefined,
    agent_type: "productography",
    skip_credit_deduction: teamDeducted ? true : undefined,
  };

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
