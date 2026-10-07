// ============================================================
// Server-side refund for a FAILED generation — one place, used by
//   • /api/credits/refund            (the page asks for it)
//   • /api/cron/generation-sweeper   (nobody asked — safety net)
//   • the generate routes            (n8n could not be reached)
// ============================================================
// Rules:
//   1. The amount is never taken from the browser. It is what the
//      credit ledger says is STILL charged for this generation:
//          charged (negative ledger rows) − refunded (refund rows)
//      so a refund that already happened — by this code, by the
//      generate route or by the n8n workflow — is not paid twice.
//   2. A generation is refunded once: an atomic claim on
//      generations.credits_refunded lets only one caller through.
//   3. Team generations go back to the team pool, personal ones to
//      the user.
//
// Where the charge is recorded:
//   • the route charged  → generations.credits_used > 0, ledger row
//     under the generation id (single) or the batch id (bulk).
//   • n8n charged (Productography personal) → credits_used is 0 and
//     the ledger row is under the generation id. n8n also refunds
//     its own failures, so we wait a little before stepping in.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { refundCredits, refundTeamCredits } from "@/lib/creditsServer";

/** Highest price of a single image (Ultra + mobile + every add-on). */
export const MAX_SINGLE_IMAGE_CREDITS = 45;

/**
 * Deductions are written to the credit ledger from this moment on
 * (sql/2026-10-07-p0-security.sql). Older generations have no ledger
 * row for their charge.
 */
export const LEDGER_RECORDS_DEDUCTIONS_SINCE = Date.parse("2026-10-07T11:15:00Z");

/**
 * When n8n charged the credits it also refunds its own failures.
 * Give that refund time to land before we look at the ledger,
 * otherwise both sides could pay the same generation back.
 */
export const N8N_REFUND_GRACE_MS = 90_000;

export const REFUND_ROW_COLUMNS =
  "id, user_id, status, team_id, credits_used, credits_refunded, created_at, updated_at, batch_id";

export type RefundableRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  team_id: string | null;
  credits_used: number | null;
  credits_refunded: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  batch_id: string | null;
};

export type RefundOutcome =
  | { kind: "refunded"; amount: number; pool: "team" | "personal"; newBalance?: number }
  | { kind: "nothing_to_refund" }
  | { kind: "already_refunded" }
  | { kind: "wait"; retryAfterMs: number }
  | { kind: "not_failed"; status: string }
  | { kind: "error"; message: string };

export type RefundOptions = {
  /** Short tag for the ledger, e.g. "client_detected_failure". */
  reason: string;
  /**
   * Only for generations made before the ledger recorded deductions:
   * the amount the page says it charged. Capped at one image's price.
   */
  legacyClientAmount?: number;
  /** Skip the wait for n8n's own refund (the sweeper runs late anyway). */
  skipGrace?: boolean;
  now?: number;
};

type LedgerSummary = { charged: number; refunded: number; hasCharge: boolean };

type LedgerRow = { delta: number | string | null; reason: string | null };

/** Pure — exported for tests. */
export function summariseLedger(rows: LedgerRow[]): LedgerSummary {
  let charged = 0;
  let refunded = 0;
  let hasCharge = false;
  for (const row of rows) {
    const delta = Number(row.delta ?? 0);
    const reason = String(row.reason ?? "");
    if (!Number.isFinite(delta)) continue;
    if (delta < 0) {
      charged += -delta;
      hasCharge = true;
    } else if (delta === 0 && /:unlimited$/i.test(reason)) {
      // Unlimited plans are "charged" 0 — a real charge row worth nothing.
      hasCharge = true;
    } else if (delta > 0 && /^refund/i.test(reason)) {
      refunded += delta;
    }
  }
  return { charged, refunded, hasCharge };
}

/**
 * Pure — exported for tests. How many credits are still owed back.
 *   own   = ledger rows under the generation's own id
 *   batch = ledger rows under its batch id (bulk jobs), or null
 */
export function netRefundAmount(
  creditsUsed: number,
  own: LedgerSummary,
  batch: LedgerSummary | null,
): number {
  if (own.hasCharge) {
    return Math.max(0, own.charged - own.refunded);
  }
  if (creditsUsed > 0) {
    // Bulk: the single charge for the whole job sits under the batch id.
    // If that charge was worth nothing (unlimited plan) or the route
    // already gave the whole job back, nothing is owed for an item.
    if (batch?.hasCharge && batch.charged - batch.refunded <= 0) return 0;
    return Math.max(0, creditsUsed - own.refunded);
  }
  return 0;
}

async function readLedger(
  db: SupabaseClient,
  pool: { teamId: string } | { userId: string },
  ledgerId: string,
): Promise<LedgerSummary> {
  const query =
    "teamId" in pool
      ? db
          .from("team_credit_transactions")
          .select("delta, reason")
          .eq("team_id", pool.teamId)
          .eq("generation_id", ledgerId)
      : db
          .from("credit_transactions")
          .select("delta, reason")
          .eq("user_id", pool.userId)
          .eq("generation_id", ledgerId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return summariseLedger((data ?? []) as LedgerRow[]);
}

function cleanReason(reason: string): string {
  const tag = /^[a-z0-9_:-]{1,60}$/i.test(reason) ? reason : "generation_failed";
  return tag.startsWith("refund:") ? tag : `refund:${tag}`;
}

/**
 * Give back whatever is still charged for a failed generation.
 * Safe to call any number of times, from any number of places.
 */
export async function refundFailedGeneration(
  db: SupabaseClient,
  row: RefundableRow,
  options: RefundOptions,
): Promise<RefundOutcome> {
  if (row.status !== "failed") {
    return { kind: "not_failed", status: String(row.status ?? "unknown") };
  }
  if (row.credits_refunded === true) return { kind: "already_refunded" };
  if (!row.user_id) return { kind: "nothing_to_refund" };

  const now = options.now ?? Date.now();
  const creditsUsed = Math.max(0, Math.floor(Number(row.credits_used ?? 0)));
  const teamId = typeof row.team_id === "string" && row.team_id ? row.team_id : null;
  const pool = teamId ? { teamId } : { userId: row.user_id };

  // n8n charged this one — let its own refund land first.
  if (creditsUsed === 0 && !options.skipGrace) {
    const failedAt = Date.parse(String(row.updated_at ?? row.created_at ?? ""));
    if (Number.isFinite(failedAt) && now - failedAt < N8N_REFUND_GRACE_MS) {
      return { kind: "wait", retryAfterMs: N8N_REFUND_GRACE_MS - (now - failedAt) };
    }
  }

  let own: LedgerSummary;
  let batch: LedgerSummary | null = null;
  try {
    own = await readLedger(db, pool, row.id);
    if (!own.hasCharge && creditsUsed > 0 && row.batch_id) {
      batch = await readLedger(db, pool, row.batch_id);
    }
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : "Ledger read failed." };
  }

  let amount = netRefundAmount(creditsUsed, own, batch);

  // Generations from before the ledger recorded deductions.
  if (amount <= 0 && !own.hasCharge && creditsUsed === 0 && own.refunded === 0) {
    const createdAt = Date.parse(String(row.created_at ?? ""));
    const isLegacyRow = Number.isFinite(createdAt) && createdAt < LEDGER_RECORDS_DEDUCTIONS_SINCE;
    const hint = Math.floor(Number(options.legacyClientAmount));
    if (isLegacyRow && Number.isFinite(hint) && hint > 0) {
      amount = Math.min(hint, MAX_SINGLE_IMAGE_CREDITS);
    }
  }

  if (amount <= 0) {
    // Settled: either nothing was charged or it was already given back.
    await db.from("generations").update({ credits_refunded: true }).eq("id", row.id);
    return own.refunded > 0 ? { kind: "already_refunded" } : { kind: "nothing_to_refund" };
  }

  // Atomic claim — only one caller can flip the flag.
  const { data: claimed, error: claimErr } = await db
    .from("generations")
    .update({ credits_refunded: true })
    .eq("id", row.id)
    .eq("status", "failed")
    .or("credits_refunded.is.null,credits_refunded.eq.false")
    .select("id");
  if (claimErr) return { kind: "error", message: claimErr.message };
  if (!claimed || claimed.length === 0) return { kind: "already_refunded" };

  const reason = cleanReason(options.reason);
  const result = teamId
    ? await refundTeamCredits(teamId, row.user_id, amount, reason, row.id)
    : await refundCredits(row.user_id, amount, reason, row.id);

  if (!result.ok) {
    // Release the claim so the next attempt (page or sweeper) can retry.
    await db.from("generations").update({ credits_refunded: false }).eq("id", row.id);
    return { kind: "error", message: result.message || "Refund failed." };
  }

  return {
    kind: "refunded",
    amount,
    pool: teamId ? "team" : "personal",
    newBalance: result.newBalance,
  };
}

/**
 * The generate route already gave the credits back itself (n8n could
 * not be reached, bad reply…). Close the rows so nobody refunds them
 * a second time and the page stops waiting.
 */
export async function closeRefundedGenerations(
  db: SupabaseClient,
  generationIds: string[],
  errorMessage: string,
): Promise<void> {
  const ids = generationIds.filter((id) => typeof id === "string" && id);
  if (ids.length === 0) return;
  const { error } = await db
    .from("generations")
    .update({
      status: "failed",
      credits_refunded: true,
      error_message: errorMessage.slice(0, 300),
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)
    .in("status", ["pending", "processing", "queued"]);
  if (error) console.error("[closeRefundedGenerations]", error.message);
}

/**
 * Mark an unfinished generation failed and refund it in one go.
 * Used when the route learns that n8n never took the job.
 */
export async function failAndRefundGeneration(
  db: SupabaseClient,
  generationId: string,
  errorMessage: string,
  reason: string,
): Promise<RefundOutcome> {
  const { data, error } = await db
    .from("generations")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 300),
      updated_at: new Date().toISOString(),
    })
    .eq("id", generationId)
    .in("status", ["pending", "processing", "queued"])
    .select(REFUND_ROW_COLUMNS);
  if (error) return { kind: "error", message: error.message };
  const row = (data?.[0] ?? null) as RefundableRow | null;
  if (!row) return { kind: "nothing_to_refund" };
  // The route charged it, so there is no n8n refund to wait for.
  return refundFailedGeneration(db, row, { reason, skipGrace: true });
}
