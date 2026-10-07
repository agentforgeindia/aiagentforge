// ============================================================
// /api/jewellery/generate  — HARDENED (Pillar 5)
// ============================================================
// Old behaviour: trusted body.user_id, no auth, no rate-limit,
// client deducted credits on its own. Anyone could curl this
// route and drain the n8n + AI budget.
//
// New behaviour:
//   1. Require an Authorization: Bearer <jwt> header → verify
//      with Supabase. Replaces body.user_id with the verified id.
//   2. Validate body shape + any image URLs (must be hosted on
//      Supabase / aiagentforge.in — blocks SSRF / hot-link abuse).
//   3. Atomically deduct credits via the deduct_credits() SQL
//      function (race-safe, audit-logged).
//   4. Insert generations row(s) server-side with the verified id.
//   5. Forward to n8n. If n8n fails → refund credits + 502.
//
// Client flow (see jewellery-ai/page.tsx changes):
//   const { data } = await supabase.auth.getSession();
//   fetch("/api/jewellery/generate", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${data.session?.access_token}`,
//     },
//     body: JSON.stringify(payload),
//   });
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { isAgentEnabled } from "@/lib/agentEnabled";
import { deductCredits, refundCredits, deductTeamCredits, refundTeamCredits, readCredits, serviceDb } from "@/lib/creditsServer";
import { closeRefundedGenerations } from "@/lib/generationRefund";
import { getTeamMembership, teamHasBulkAccess } from "@/lib/teamAuth";
import { hasBulkAccess } from "@/lib/plans";
import { clampCredits, jewelleryCreditRange, scaleRange } from "@/lib/creditPricing";
import {
  DuplicateGenerationIdError,
  insertGenerationRowsStrict,
  n8nHeaders,
} from "@/lib/generationRows";
import { detectClientSource, type ClientSource } from "@/lib/clientSource";
import {
  firstUntrustedUrl,
  isAgentForgeHostedUrl,
} from "@/lib/uploadValidation";

export const runtime = "nodejs";

// Safety caps — the client sends required_credits but we cap it
// so a bug or malicious client can't request a 10,000-credit
// burn in one call.
const MAX_CREDITS_PER_CALL = 5_000;
const MAX_BULK_ITEMS = 100;

const webhookUrl =
  process.env.N8N_JEWELLERY_WEBHOOK_URL ||
  "https://n8n.aiagentforge.in/webhook/generate-jewellery";

// ────────────────────────────────────────────────────────────
// Body shape — narrow what we accept.
// ────────────────────────────────────────────────────────────

type SingleBody = {
  generation_mode: "single";
  generation_id: string;
  required_credits: number;
  source_image_url: string;
  team_id?: string | null;
  [k: string]: unknown;
};

type BulkBody = {
  generation_mode: "bulk";
  required_credits: number;
  batch_id?: string | null;
  team_id?: string | null;
  items: Array<{
    generation_id: string;
    source_image_url: string;
    name?: string;
    original_name?: string;
  }>;
  [k: string]: unknown;
};

type Body = SingleBody | BulkBody;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isUuidish(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f-]{32,40}$/i.test(s);
}

function validateBody(body: any): { ok: true; body: Body } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body must be JSON." };

  const mode = body.generation_mode;
  if (mode !== "single" && mode !== "bulk") {
    return { ok: false, error: "generation_mode must be 'single' or 'bulk'." };
  }

  const credits = Number(body.required_credits);
  if (!Number.isFinite(credits) || credits <= 0 || credits > MAX_CREDITS_PER_CALL) {
    return {
      ok: false,
      error: `required_credits must be a positive integer ≤ ${MAX_CREDITS_PER_CALL}.`,
    };
  }

  if (mode === "single") {
    if (!isUuidish(body.generation_id)) {
      return { ok: false, error: "generation_id missing / not a UUID." };
    }
    if (!isAgentForgeHostedUrl(body.source_image_url)) {
      return { ok: false, error: "source_image_url is not an AgentForge-hosted URL." };
    }
    return { ok: true, body: body as SingleBody };
  }

  // bulk
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, error: "items must be a non-empty array for bulk mode." };
  }
  if (body.items.length > MAX_BULK_ITEMS) {
    return { ok: false, error: `bulk size capped at ${MAX_BULK_ITEMS}.` };
  }
  for (const item of body.items) {
    if (!isUuidish(item?.generation_id)) {
      return { ok: false, error: "every item needs a UUID generation_id." };
    }
    if (!isAgentForgeHostedUrl(item?.source_image_url)) {
      return {
        ok: false,
        error: "every item.source_image_url must be AgentForge-hosted.",
      };
    }
  }
  const untrusted = firstUntrustedUrl([body.source_image_url].filter(Boolean));
  if (untrusted) {
    return { ok: false, error: `Untrusted top-level URL: ${untrusted}` };
  }
  return { ok: true, body: body as BulkBody };
}

// ────────────────────────────────────────────────────────────
// Generations row insert — uses service role (RLS bypass).
// ────────────────────────────────────────────────────────────

async function createGenerationRows(
  body: Body,
  userId: string,
  teamId: string | null | undefined,
  /** Where the request came from — app / phone browser / desktop. */
  clientSource: ClientSource,
  /** Credits charged for EACH image — the refund route reads this back. */
  creditsPerItem: number,
) {
  const rows =
    body.generation_mode === "single"
      ? [
          {
            id: body.generation_id,
            user_id: userId,
            status: "pending" as const,
            agent_type: "jewellery",
            team_id: teamId ?? null,
            client_source: clientSource,
            credit_cost: creditsPerItem,
            credits_used: creditsPerItem,
          },
        ]
      : body.items.map((item) => ({
          id: item.generation_id,
          user_id: userId,
          status: "pending" as const,
          batch_id: body.batch_id ?? null,
          agent_type: "jewellery",
          team_id: teamId ?? null,
          client_source: clientSource,
          credit_cost: creditsPerItem,
          credits_used: creditsPerItem,
        }));

  // Plain insert — a generation id that already exists is rejected
  // instead of overwriting that row (see lib/generationRows.ts).
  await insertGenerationRowsStrict(rows);
}

// ────────────────────────────────────────────────────────────
// Route handler
// ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth — JWT in Authorization header.
  const userOrResp = await requireUser(request);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  // 1b. Agent kill-switch — blocked from /admin/agents.
  if (!(await isAgentEnabled("jewellery"))) {
    return NextResponse.json({ error: "Jewellery AI is temporarily disabled. Please try again later." }, { status: 403 });
  }

  // 2. Parse + validate body.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const v = validateBody(raw);
  if (!v.ok) return bad(v.error);
  const body = v.body;

  // 2b. Price on the SERVER. The browser's required_credits is only
  // accepted inside the range the selected options allow — it can no
  // longer be set to 1 for an Ultra HD or 100-image job.
  const itemCount = body.generation_mode === "bulk" ? body.items.length : 1;
  const perItemRange = jewelleryCreditRange(body as Record<string, unknown>);
  const requiredCredits = clampCredits(
    body.required_credits,
    scaleRange(perItemRange, itemCount),
  );
  const creditsPerItem = Math.ceil(requiredCredits / itemCount);

  // Anchor generation_id for audit log.
  const auditGenerationId =
    body.generation_mode === "single" ? body.generation_id : body.batch_id ?? null;

  // 3. Resolve credit source: team pool or personal balance.
  const teamId = typeof body.team_id === "string" && body.team_id ? body.team_id : null;

  if (teamId) {
    // Verify membership + bulk access
    const membership = await getTeamMembership(user.id, teamId);
    if (!membership) {
      return NextResponse.json({ error: "Team not found or you are not a member." }, { status: 403 });
    }
    if (body.generation_mode === "bulk" && !teamHasBulkAccess(membership.plan)) {
      return NextResponse.json(
        { error: "Team plan does not include bulk generation.", code: "PLAN_REQUIRED" },
        { status: 403 },
      );
    }
  }

  // 3b. Bulk on a personal account needs a plan that includes it. The
  // page already hides bulk for other plans; this stops a direct API call.
  if (!teamId && body.generation_mode === "bulk") {
    const account = await readCredits(user.id);
    if (!hasBulkAccess(account?.plan ?? undefined)) {
      return NextResponse.json(
        { error: "Bulk generation is available on Pro and Empire plans.", code: "PLAN_REQUIRED" },
        { status: 403 },
      );
    }
  }

  // 4. Atomic credit deduction (team pool or personal).
  const deduct = teamId
    ? await deductTeamCredits(teamId, user.id, requiredCredits, "jewellery_generate", auditGenerationId ?? undefined)
    : await deductCredits(user.id, requiredCredits, "jewellery_generate", auditGenerationId ?? undefined);

  if (!deduct.ok) {
    if (deduct.reason === "insufficient") {
      return NextResponse.json(
        {
          error: teamId
            ? "Not enough credits in team pool."
            : "Not enough credits.",
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 },
      );
    }
    return NextResponse.json(
      { error: deduct.message || "Credit deduction failed." },
      { status: 500 },
    );
  }

  // 5. Insert generations row(s) with verified user_id + team_id.
  try {
    await createGenerationRows(body, user.id, teamId, detectClientSource(request), creditsPerItem);
  } catch (err: any) {
    // Refund to correct pool
    if (teamId) {
      await refundTeamCredits(teamId, user.id, requiredCredits, "refund:generation_row_insert_failed", auditGenerationId ?? undefined);
    } else {
      await refundCredits(user.id, requiredCredits, "refund:generation_row_insert_failed", auditGenerationId ?? undefined);
    }
    return NextResponse.json(
      { error: err?.message || "Failed to register generation." },
      { status: err instanceof DuplicateGenerationIdError ? 409 : 500 },
    );
  }

  // Every row of this request — closed together when the route itself
  // refunds the whole job, so nothing is refunded a second time.
  const allGenerationIds =
    body.generation_mode === "single"
      ? [body.generation_id]
      : body.items.map((item) => item.generation_id);

  // 6. Forward to n8n with the verified user_id and the server price.
  const forwardedPayload: Record<string, unknown> = {
    ...body,
    user_id: user.id,
    team_id: teamId ?? undefined,
    required_credits: requiredCredits,
  };
  if (body.shared_settings && typeof body.shared_settings === "object") {
    forwardedPayload.shared_settings = {
      ...(body.shared_settings as Record<string, unknown>),
      required_credits: requiredCredits,
    };
  }

  let webhookResponse: Response;
  try {
    webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: n8nHeaders(),
      body: JSON.stringify(forwardedPayload),
      cache: "no-store",
    });
  } catch (err: any) {
    if (teamId) {
      await refundTeamCredits(teamId, user.id, requiredCredits, "refund:n8n_network_error", auditGenerationId ?? undefined);
    } else {
      await refundCredits(user.id, requiredCredits, "refund:n8n_network_error", auditGenerationId ?? undefined);
    }
    await closeRefundedGenerations(serviceDb(), allGenerationIds, "The image service could not be reached.");
    return NextResponse.json(
      { error: err?.message || "n8n unreachable." },
      { status: 502 },
    );
  }

  const rawText = await webhookResponse.text();
  let n8nData: any = null;
  try {
    n8nData = rawText ? JSON.parse(rawText) : null;
  } catch {
    n8nData = { raw: rawText };
  }

  if (!webhookResponse.ok) {
    if (teamId) {
      await refundTeamCredits(teamId, user.id, requiredCredits, "refund:n8n_error", auditGenerationId ?? undefined);
    } else {
      await refundCredits(user.id, requiredCredits, "refund:n8n_error", auditGenerationId ?? undefined);
    }
    await closeRefundedGenerations(
      serviceDb(),
      allGenerationIds,
      `The image service returned an error (${webhookResponse.status}).`,
    );
    return NextResponse.json(
      {
        error: n8nData?.error || n8nData?.message || "n8n webhook request failed",
        details: n8nData,
      },
      { status: webhookResponse.status },
    );
  }

  // 7. Success — return new balance for client UI refresh.
  return NextResponse.json({
    success: true,
    mode: body.generation_mode,
    generation_id:
      body.generation_mode === "single" ? body.generation_id : undefined,
    generation_ids:
      body.generation_mode === "bulk"
        ? body.items.map((item) => item.generation_id)
        : undefined,
    batch_id: body.generation_mode === "bulk" ? body.batch_id ?? null : undefined,
    new_balance: deduct.newBalance,
    credits_charged: requiredCredits,
    team_id: teamId ?? undefined,
    message:
      body.generation_mode === "single"
        ? "Jewellery generation started."
        : "Bulk jewellery generation started.",
    webhook_response: n8nData,
  });
}
