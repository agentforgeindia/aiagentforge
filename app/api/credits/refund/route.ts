// ============================================================
// /api/credits/refund  — server-gated refund flow
// ============================================================
// The page polls generations.status. If a row goes "failed", the
// page posts here with the generation_id.
//
// We refund ONLY IF:
//   • the JWT-verified user owns the generation row, AND
//   • status = 'failed', AND
//   • credits are still charged for it (ledger: charged − refunded).
//
// SECURITY: the refund AMOUNT is decided on the server — see
// lib/generationRefund.ts. The `amount` field in the request is
// only used, capped at the price of one image, for generations
// created before the ledger recorded deductions.
//
// The same logic runs from /api/cron/generation-sweeper, so a
// generation is refunded even if the page was closed.
// ============================================================

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/serverAuth";
import { serviceDb } from "@/lib/creditsServer";
import {
  REFUND_ROW_COLUMNS,
  refundFailedGeneration,
  type RefundableRow,
} from "@/lib/generationRefund";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  let body: Record<string, unknown> | null;
  try {
    body = (await req.json()) as Record<string, unknown> | null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const generationId = typeof body?.generation_id === "string" ? body.generation_id : null;
  const reason =
    typeof body?.reason === "string" && /^[a-z0-9_:-]{1,60}$/i.test(body.reason)
      ? body.reason
      : "generation_failed";

  if (!generationId || !/^[0-9a-f-]{32,40}$/i.test(generationId)) {
    return NextResponse.json({ error: "generation_id required." }, { status: 400 });
  }

  const db = serviceDb();

  const { data, error: rowErr } = await db
    .from("generations")
    .select(REFUND_ROW_COLUMNS)
    .eq("id", generationId)
    .maybeSingle();
  const row = data as RefundableRow | null;

  if (rowErr) {
    return NextResponse.json({ error: rowErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Generation not found." }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: "Not your generation." }, { status: 403 });
  }

  const outcome = await refundFailedGeneration(db, row, {
    reason,
    legacyClientAmount: Number(body?.amount),
  });

  switch (outcome.kind) {
    case "refunded":
      return NextResponse.json({
        success: true,
        refunded: outcome.amount,
        new_balance: outcome.pool === "personal" ? outcome.newBalance : undefined,
        team_balance: outcome.pool === "team" ? outcome.newBalance : undefined,
      });
    case "already_refunded":
      return NextResponse.json({ success: true, alreadyRefunded: true });
    case "nothing_to_refund":
      return NextResponse.json({ success: true, refunded: 0 });
    case "wait":
      // The workflow that charged this generation refunds its own
      // failures; the sweeper settles anything it leaves behind.
      return NextResponse.json({
        success: true,
        pending: true,
        retry_after_seconds: Math.ceil(outcome.retryAfterMs / 1000),
      });
    case "not_failed":
      return NextResponse.json(
        { error: `Cannot refund — generation status is '${outcome.status}'.` },
        { status: 409 },
      );
    default:
      return NextResponse.json({ error: outcome.message || "Refund failed." }, { status: 500 });
  }
}
