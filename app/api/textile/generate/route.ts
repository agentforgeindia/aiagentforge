// ============================================================
// /api/textile/generate  — HARDENED (Pillar 5)
// ============================================================
// Old behaviour (still live before this commit): the browser
// POSTed straight to NEXT_PUBLIC_N8N_PRODUCTION_WEBHOOK. The
// webhook URL was therefore public, and `user_id` came from the
// browser body untrusted. Anyone could burn the AI budget.
//
// New behaviour:
//   1. Require Authorization: Bearer <jwt>.
//   2. Validate body shape + design_url (must be hosted by us).
//   3. Insert the generations row server-side with the
//      JWT-verified user_id.
//   4. Forward to n8n with user_id overwritten to the verified
//      value (so even a lying client can't bill another user).
//
// Note on credits:
//   For the textile pipeline the credit deduction lives inside
//   the n8n workflow itself (it calls the deduct_credits() RPC).
//   We don't double-deduct here; we just gate access. If you
//   ever move the deduction out of n8n, copy the jewellery
//   pattern (see app/api/jewellery/generate/route.ts).
// ============================================================

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/serverAuth";
import { isAgentForgeHostedUrl } from "@/lib/uploadValidation";
import { isAgentEnabled } from "@/lib/agentEnabled";
import { getTeamMembership } from "@/lib/teamAuth";
import { deductTeamCredits, refundTeamCredits } from "@/lib/creditsServer";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-side webhook URL — must NOT be NEXT_PUBLIC_* once this
// route is the only caller. We accept the legacy public env var
// as a fallback during migration.
const webhookUrl =
  process.env.N8N_TEXTILE_WEBHOOK_URL ||
  process.env.NEXT_PUBLIC_N8N_PRODUCTION_WEBHOOK ||
  process.env.N8N_PRODUCTION_WEBHOOK;

// Safety caps.
const MAX_CREDITS_PER_CALL = 1_000;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isUuidish(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f-]{32,40}$/i.test(s);
}

// ────────────────────────────────────────────────────────────
// Generations row insert — service-role bypasses RLS so the
// id we insert is the verified one, not whatever the client
// claimed.
// ────────────────────────────────────────────────────────────
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
        agent_type: "textile",
        category: "textile",
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

// ────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Auth.
  const userOrResp = await requireUser(request);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  if (!(await isAgentEnabled("textile"))) {
    return NextResponse.json({ error: "Textile AI is temporarily disabled. Please try again later." }, { status: 403 });
  }

  if (!webhookUrl || !/^https?:\/\//i.test(webhookUrl)) {
    return bad(
      "Textile webhook URL is not configured. Set N8N_TEXTILE_WEBHOOK_URL.",
      500,
    );
  }

  // 2. Parse + validate body.
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

  // 3. Resolve team context — if team_id present, deduct here (not in n8n).
  const teamId = typeof body?.team_id === "string" && body.team_id ? body.team_id : null;

  let teamDeducted = false;
  if (teamId && credits > 0) {
    const membership = await getTeamMembership(user.id, teamId);
    if (!membership) {
      return NextResponse.json({ error: "Team not found or you are not a member." }, { status: 403 });
    }

    const deduct = await deductTeamCredits(
      teamId, user.id, credits,
      "textile_generate", body.generation_id,
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

  // 4. Persist generation row.
  try {
    await insertGenerationRow({
      id: body.generation_id,
      user_id: user.id,
      team_id: teamId,
      design_url: body.design_url,
      product_type: body.product_type,
      model_type: body.model_type,
      shoot_style: body.shoot_style,
      output_size: body.output_size,
      quality: body.quality,
      article_number: body.article_number ?? body.design_number ?? null,
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

  // 5. Forward to n8n. When the team pool was already charged here, we
  // both (a) flag skip_credit_deduction AND (b) zero out the credit
  // fields in the forwarded payload — so even an unmodified n8n flow
  // that deducts from `required_credits` charges 0 to personal balance.
  const forwarded = teamDeducted
    ? {
        ...body,
        user_id: user.id,
        team_id: teamId ?? undefined,
        skip_credit_deduction: true,
        required_credits: 0,
        credits_required: 0,
      }
    : { ...body, user_id: user.id, team_id: teamId ?? undefined };

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(forwarded),
    cache: "no-store",
  }).catch((err) => {
    console.error("n8n trigger failed:", err);
  });

  return NextResponse.json({
    success: true,
    status: "processing",
    generation_id: body.generation_id,
    team_credits_used: teamDeducted ? credits : undefined,
  });
}
