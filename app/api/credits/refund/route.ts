// ============================================================
// /api/credits/refund  — server-gated refund flow
// ============================================================
// The client polls generations.status. If a row goes "failed"
// (because n8n's worker died after our route returned 200), the
// client posts here with the generation_id.
//
// We refund ONLY IF:
//   • The JWT-verified user owns the generation row, AND
//   • status = 'failed', AND
//   • this generation has not been refunded before (atomic claim
//     on generations.credits_refunded + ledger check).
//
// SECURITY: the refund AMOUNT is decided here, never by the
// browser. It is what was actually charged for this generation:
//   1. generations.credits_used  (written by the generate route), or
//   2. the deduction recorded in the credit ledger for this id.
// The `amount` field in the request is only used — capped at the
// price of one image — for generations created before the ledger
// recorded deductions.
// ============================================================

import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/serverAuth";
import { refundCredits, refundTeamCredits } from "@/lib/creditsServer";

export const runtime = "nodejs";

/** Highest price of a single image (Ultra + mobile + every add-on). */
const MAX_SINGLE_IMAGE_CREDITS = 45;

/**
 * Deductions are written to the credit ledger from this moment on
 * (sql/2026-10-07-p0-security.sql). Older generations have no ledger
 * row, so the capped client amount is the only figure available.
 */
const LEDGER_RECORDS_DEDUCTIONS_SINCE = Date.parse("2026-10-07T11:15:00Z");

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Net credits still charged for this generation according to the ledger. */
async function ledgerCharge(
  db: SupabaseClient,
  table: "credit_transactions" | "team_credit_transactions",
  scope: { column: "user_id" | "team_id"; value: string },
  generationId: string,
): Promise<{ charged: number; alreadyRefunded: boolean }> {
  const { data } = await db
    .from(table)
    .select("delta, reason")
    .eq(scope.column, scope.value)
    .eq("generation_id", generationId);

  let charged = 0;
  let alreadyRefunded = false;
  for (const row of (data ?? []) as { delta: number | null; reason: string | null }[]) {
    const delta = Number(row.delta ?? 0);
    const reason = String(row.reason ?? "");
    if (delta < 0) charged += -delta;
    else if (delta > 0 && /^refund/i.test(reason)) {
      charged -= delta;
      alreadyRefunded = true;
    }
  }
  return { charged: Math.max(0, charged), alreadyRefunded };
}

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
  const clientAmount = Number(body?.amount);
  const reasonHint =
    typeof body?.reason === "string" && /^[a-z0-9_:-]{1,60}$/i.test(body.reason)
      ? body.reason
      : "generation_failed";

  if (!generationId || !/^[0-9a-f-]{32,40}$/i.test(generationId)) {
    return NextResponse.json({ error: "generation_id required." }, { status: 400 });
  }

  const db = admin();

  // 1. Ownership + status check.
  const { data: row, error: rowErr } = await db
    .from("generations")
    .select("id, user_id, status, team_id, credits_used, credits_refunded, created_at")
    .eq("id", generationId)
    .maybeSingle();

  if (rowErr) {
    return NextResponse.json({ error: rowErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Generation not found." }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: "Not your generation." }, { status: 403 });
  }
  if (row.status !== "failed") {
    return NextResponse.json(
      { error: `Cannot refund — generation status is '${row.status}'.` },
      { status: 409 },
    );
  }
  if (row.credits_refunded === true) {
    return NextResponse.json({ success: true, alreadyRefunded: true }, { status: 200 });
  }

  // 2. Work out what was really charged.
  const teamId = typeof row.team_id === "string" && row.team_id ? row.team_id : null;
  const ledger = teamId
    ? await ledgerCharge(db, "team_credit_transactions", { column: "team_id", value: teamId }, generationId)
    : await ledgerCharge(db, "credit_transactions", { column: "user_id", value: user.id }, generationId);

  if (ledger.alreadyRefunded) {
    await db.from("generations").update({ credits_refunded: true }).eq("id", generationId);
    return NextResponse.json({ success: true, alreadyRefunded: true }, { status: 200 });
  }

  const recorded = Math.max(0, Math.floor(Number(row.credits_used ?? 0)));
  let amount = recorded > 0 ? recorded : ledger.charged;

  if (amount <= 0) {
    const createdAt = Date.parse(String(row.created_at ?? ""));
    const isLegacyRow = Number.isFinite(createdAt) && createdAt < LEDGER_RECORDS_DEDUCTIONS_SINCE;
    if (isLegacyRow && Number.isFinite(clientAmount) && clientAmount > 0) {
      amount = Math.min(Math.floor(clientAmount), MAX_SINGLE_IMAGE_CREDITS);
    }
  }

  if (amount <= 0) {
    // Nothing was charged for this generation — nothing to give back.
    return NextResponse.json({ success: true, refunded: 0 }, { status: 200 });
  }

  // 3. Atomic claim — only one request can flip the flag, so two
  // simultaneous calls cannot both refund.
  const { data: claimed, error: claimErr } = await db
    .from("generations")
    .update({ credits_refunded: true })
    .eq("id", generationId)
    .eq("status", "failed")
    .or("credits_refunded.is.null,credits_refunded.eq.false")
    .select("id");

  if (claimErr) {
    return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ success: true, alreadyRefunded: true }, { status: 200 });
  }

  // 4. Refund to the pool that paid.
  const result = teamId
    ? await refundTeamCredits(teamId, user.id, amount, `refund:${reasonHint}`, generationId)
    : await refundCredits(user.id, amount, `refund:${reasonHint}`, generationId);

  if (!result.ok) {
    // Release the claim so the refund can be retried.
    await db.from("generations").update({ credits_refunded: false }).eq("id", generationId);
    return NextResponse.json(
      { error: result.message || "Refund failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    refunded: amount,
    new_balance: teamId ? undefined : result.newBalance,
    team_balance: teamId ? result.newBalance : undefined,
  });
}
