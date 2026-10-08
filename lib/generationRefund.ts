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
//   4. A generation is paid for ONCE. If the image workflow also
//      charged the member's own balance for a generation the route
//      (or the team pool) already paid for, the extra charge is
//      given back — see "Duplicate charges" at the bottom.
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
  // NOTE: the "not yet refunded" test must be a plain column filter
  // (IS NOT TRUE covers both NULL and false). An `.or(...)` filter on
  // an UPDATE that returns only `id` is rejected by PostgREST
  // ("column generations.credits_refunded does not exist"), which
  // would stop every refund.
  const { data: claimed, error: claimErr } = await db
    .from("generations")
    .update({ credits_refunded: true })
    .eq("id", row.id)
    .eq("status", "failed")
    .not("credits_refunded", "is", true)
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

// ============================================================
// Duplicate charges
// ============================================================
// A generation has exactly one payer:
//   • team generation      → the team pool (charged by the route)
//   • personal, route pays → the user, once (generations.credits_used)
//   • personal, n8n pays   → the user, once (credits_used = 0)
//
// The image workflow has its own "deduct credits" step. When the
// route has already charged, it is told to skip that step — but an
// older copy of a workflow may ignore the instruction and charge the
// member's PERSONAL balance a second time. The ledger shows this as
// a personal charge under the generation id that should not exist.
// The sweeper calls the functions below to give that charge back.
//
// Nothing is refunded on a guess: the other (correct) charge must be
// visible in the ledger, and the amount is what the ledger says.
// ============================================================

export const DUPLICATE_REFUND_REASON = "refund:duplicate_charge";

export type DuplicateChargeInput = {
  isTeam: boolean;
  status: string | null;
  creditsUsed: number;
  /** Personal ledger rows under the generation's own id. */
  personal: LedgerSummary;
  /** Team ledger rows under the generation id or its batch id (team generations). */
  teamCharged: boolean;
  /** Personal ledger rows under the batch id (bulk jobs), or null. */
  personalBatch: LedgerSummary | null;
};

/** Pure — exported for tests. Credits charged to the personal balance by mistake. */
export function duplicateChargeAmount(input: DuplicateChargeInput): number {
  const net = input.personal.charged - input.personal.refunded;
  if (!(net > 0)) return 0;

  let extra = 0;
  if (input.isTeam) {
    // The team pool paid. Without proof of that, leave it alone.
    if (!input.teamCharged) return 0;
    extra = net;
  } else {
    // Failed personal generations are settled in full by
    // refundFailedGeneration — not here.
    if (input.status !== "completed") return 0;
    const creditsUsed = Math.max(0, Math.floor(input.creditsUsed));
    if (creditsUsed <= 0) return 0; // n8n is the one payer — nothing to compare
    // Bulk: the route's single charge sits under the batch id, so
    // nothing at all should be charged under the item's own id.
    const expectedOwn = input.personalBatch?.hasCharge ? 0 : creditsUsed;
    extra = net - expectedOwn;
  }
  if (!(extra > 0)) return 0;
  return Math.min(Math.floor(extra), MAX_SINGLE_IMAGE_CREDITS);
}

export type DuplicateOutcome =
  | { kind: "refunded"; amount: number; newBalance?: number }
  | { kind: "none" }
  | { kind: "already_refunded" }
  | { kind: "error"; message: string };

/**
 * Give back a personal charge that duplicates the real one.
 * Safe to repeat: after the refund the ledger nets to zero, and the
 * unique index from sql/pending/04 refuses a second duplicate refund
 * for the same generation even if two runs overlap.
 * `dryRun` only reports what would be refunded.
 */
export async function refundDuplicatePersonalCharge(
  db: SupabaseClient,
  row: RefundableRow,
  options: { dryRun?: boolean } = {},
): Promise<DuplicateOutcome> {
  if (!row.user_id) return { kind: "none" };
  if (row.status !== "completed" && row.status !== "failed") return { kind: "none" };
  const createdAt = Date.parse(String(row.created_at ?? ""));
  if (!Number.isFinite(createdAt) || createdAt < LEDGER_RECORDS_DEDUCTIONS_SINCE) return { kind: "none" };

  const teamId = typeof row.team_id === "string" && row.team_id ? row.team_id : null;
  const creditsUsed = Math.max(0, Math.floor(Number(row.credits_used ?? 0)));

  let amount = 0;
  try {
    const personal = await readLedger(db, { userId: row.user_id }, row.id);
    if (personal.charged - personal.refunded <= 0) return { kind: "none" };

    let teamCharged = false;
    let personalBatch: LedgerSummary | null = null;
    if (teamId) {
      teamCharged = (await readLedger(db, { teamId }, row.id)).hasCharge;
      if (!teamCharged && row.batch_id) {
        teamCharged = (await readLedger(db, { teamId }, row.batch_id)).hasCharge;
      }
    } else if (row.batch_id) {
      personalBatch = await readLedger(db, { userId: row.user_id }, row.batch_id);
    }

    amount = duplicateChargeAmount({
      isTeam: Boolean(teamId),
      status: row.status,
      creditsUsed,
      personal,
      teamCharged,
      personalBatch,
    });
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : "Ledger read failed." };
  }

  if (amount <= 0) return { kind: "none" };
  if (options.dryRun) return { kind: "refunded", amount };

  const result = await refundCredits(row.user_id, amount, DUPLICATE_REFUND_REASON, row.id);
  if (!result.ok) {
    // The unique index turned a second, overlapping refund away.
    if (/duplicate key|credit_tx_one_duplicate_refund/i.test(result.message || "")) {
      return { kind: "already_refunded" };
    }
    return { kind: "error", message: result.message || "Refund failed." };
  }
  return { kind: "refunded", amount, newBalance: result.newBalance };
}
