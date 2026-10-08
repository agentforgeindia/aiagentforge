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
// Credits (changed 2026-10-07):
//   The price is calculated HERE (lib/creditPricing.ts) and
//   deducted HERE — from the team pool or from the user's own
//   balance — so what is charged is exactly what the page shows
//   (Premium 15 / mobile 17, Ultra HD 30 / mobile 32, + add-ons).
//   n8n is told to skip its own deduction
//   (`skip_credit_deduction: true`, the switch the team flow has
//   always used). Before this the workflow charged its own fixed
//   17 / 20 for personal generations, whatever the page showed.
//
//   A failed generation is refunded by /api/credits/refund or the
//   sweeper (/api/cron/generation-sweeper) from the credit ledger.
// ============================================================

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/serverAuth";
import { isAgentForgeHostedUrl } from "@/lib/uploadValidation";
import { isAgentEnabled } from "@/lib/agentEnabled";
import { getTeamMembership } from "@/lib/teamAuth";
import {
  deductCredits,
  deductTeamCredits,
  refundCredits,
  refundTeamCredits,
  serviceDb,
} from "@/lib/creditsServer";
import { failAndRefundGeneration } from "@/lib/generationRefund";
import { detectClientSource, type ClientSource } from "@/lib/clientSource";
import { clampCredits, textileCreditRange } from "@/lib/creditPricing";
import {
  DuplicateGenerationIdError,
  insertGenerationRowsStrict,
  n8nHeaders,
} from "@/lib/generationRows";

export const runtime = "nodejs";

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
  /** Where the request came from — app / phone browser / desktop. */
  client_source: ClientSource;
  /** What this route charged for the image. */
  credit_cost?: number;
  credits_used?: number;
}) {
  // Plain insert — an id that already exists is rejected instead of
  // overwriting that row (see lib/generationRows.ts).
  await insertGenerationRowsStrict([
    {
      ...row,
      input_image_url: row.design_url,
      status: "pending",
      agent_type: "textile",
      category: "textile",
      team_id: row.team_id ?? null,
    },
  ]);
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

  const clientCredits = Number(body?.required_credits ?? body?.credits_required ?? 0);
  if (!Number.isFinite(clientCredits) || clientCredits < 0 || clientCredits > MAX_CREDITS_PER_CALL) {
    return bad(
      `required_credits must be a non-negative integer ≤ ${MAX_CREDITS_PER_CALL}.`,
    );
  }
  // Price on the SERVER — the browser's number is only accepted inside
  // the range the selected options allow (see lib/creditPricing.ts).
  const credits = clampCredits(clientCredits, textileCreditRange(body));

  // 3. Charge the credits here — team pool if team_id is present,
  //    otherwise the user's own balance.
  const teamId = typeof body?.team_id === "string" && body.team_id ? body.team_id : null;
  const generationId: string = body.generation_id;

  if (teamId) {
    const membership = await getTeamMembership(user.id, teamId);
    if (!membership) {
      return NextResponse.json({ error: "Team not found or you are not a member." }, { status: 403 });
    }
  }

  const deduct = teamId
    ? await deductTeamCredits(teamId, user.id, credits, "textile_generate", generationId)
    : await deductCredits(user.id, credits, "textile_generate", generationId);

  if (!deduct.ok) {
    if (deduct.reason === "insufficient") {
      return NextResponse.json(
        {
          error: teamId ? "Not enough credits in team pool." : "Not enough credits.",
          code: "INSUFFICIENT_CREDITS",
          required_credits: credits,
        },
        { status: 402 },
      );
    }
    return NextResponse.json({ error: deduct.message || "Credit deduction failed." }, { status: 500 });
  }

  const refundCharge = (reason: string) =>
    teamId
      ? refundTeamCredits(teamId, user.id, credits, reason, generationId)
      : refundCredits(user.id, credits, reason, generationId);

  // 4. Persist generation row.
  try {
    await insertGenerationRow({
      id: generationId,
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
      client_source: detectClientSource(request),
      credit_cost: credits,
      credits_used: credits,
    });
  } catch (err: any) {
    await refundCharge("refund:generation_row_insert_failed");
    return NextResponse.json(
      { error: err?.message || "Failed to register generation." },
      { status: err instanceof DuplicateGenerationIdError ? 409 : 500 },
    );
  }

  // 5. Forward to n8n. The credits were charged above, so the workflow
  //    is told to skip its own deduction and the credit fields are
  //    zeroed — exactly what the team flow has always sent.
  //
  // SECURITY: `skip_credit_deduction` is decided HERE. A value sent by
  // the browser is always overwritten.
  const forwarded = {
    ...body,
    user_id: user.id,
    team_id: teamId ?? undefined,
    skip_credit_deduction: true,
    required_credits: 0,
    credits_required: 0,
    server_charged_credits: credits,
  };

  // The workflow answers only when the image is ready (minutes), so the
  // page is not kept waiting for it. If n8n never takes the job, give
  // the credits back straight away instead of leaving the row hanging.
  const giveBack = (why: string) =>
    failAndRefundGeneration(serviceDb(), generationId, why, "textile_n8n_unreachable").catch((e) =>
      console.error("[textile/generate] refund after n8n failure failed:", e),
    );

  fetch(webhookUrl, {
    method: "POST",
    headers: n8nHeaders(),
    body: JSON.stringify(forwarded),
    cache: "no-store",
  })
    .then((res) => {
      // 401/403/404 = the webhook rejected or did not find the job.
      // (Other failures are reported by the workflow itself, which marks
      // the row failed; the refund then comes from the ledger.)
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        return giveBack(`The image service did not accept the job (${res.status}).`);
      }
    })
    .catch((err) => {
      console.error("n8n trigger failed:", err);
      // A dropped connection AFTER the job started is not a failure —
      // only refund when the row never left "pending".
      return serviceDb()
        .from("generations")
        .select("status")
        .eq("id", generationId)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.status === "pending") {
            return giveBack("The image service could not be reached.");
          }
        });
    });

  return NextResponse.json({
    success: true,
    status: "processing",
    generation_id: generationId,
    credits_charged: credits,
    new_balance: teamId ? undefined : deduct.newBalance,
    team_credits_used: teamId ? credits : undefined,
  });
}
