// ============================================================
// AgentForge server-side credit operations
// ============================================================
// Thin wrappers around the SQL functions in sql/credits.sql.
// MUST be called from server contexts only — uses the service
// role key. Never import this from a client component.
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedAdmin: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service-role env vars missing — set SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  cachedAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}

/** Shared service-role client (bypasses RLS). Server only. */
export function serviceDb(): SupabaseClient {
  return admin();
}

export type DeductResult =
  | { ok: true; newBalance: number }
  | { ok: false; reason: "insufficient" | "error"; message?: string };

/**
 * Atomically deduct `amount` credits from `userId`'s balance.
 * Returns the new balance on success. If the user does not have
 * enough credits the SQL function returns NULL → we map to
 * `{ ok: false, reason: "insufficient" }`.
 *
 * `reason` is recorded in the credit_transactions audit log
 * (e.g. "jewellery_generate", "ugc_forge_generate").
 */
export async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
  generationId?: string,
): Promise<DeductResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "error", message: "Invalid credit amount." };
  }
  const { data, error } = await admin().rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_generation_id: generationId ?? null,
  });
  if (error) {
    return { ok: false, reason: "error", message: error.message };
  }
  return parseDeductResult(data);
}

/**
 * Normalise what `deduct_credits()` returned.
 *
 * The live database function returns JSON —
 *   { success: true,  remaining_credits: 85 }
 *   { success: false, error: "Insufficient credits" }
 * — while the older version in sql/credits.sql returned a bare number
 * (new balance) or NULL (not enough credits). Both shapes are handled.
 *
 * SECURITY: this used to treat every non-NULL answer as "deducted",
 * so the JSON failure object let users with too few credits generate
 * for free. Anything that is not a clear success is now a failure.
 */
export function parseDeductResult(data: unknown): DeductResult {
  if (data === null || data === undefined) {
    return { ok: false, reason: "insufficient" };
  }

  if (typeof data === "number" || typeof data === "string") {
    const balance = Number(data);
    return Number.isFinite(balance)
      ? { ok: true, newBalance: balance }
      : { ok: false, reason: "error", message: "Unexpected credit response." };
  }

  // PostgREST may wrap a jsonb result in a one-element array.
  const row = (Array.isArray(data) ? data[0] : data) as
    | { success?: unknown; remaining_credits?: unknown; error?: unknown }
    | null
    | undefined;

  if (!row || typeof row !== "object") {
    return { ok: false, reason: "error", message: "Unexpected credit response." };
  }

  if (row.success === true) {
    // The deduction DID happen — report success even if the balance is
    // missing, otherwise the caller would stop without refunding.
    return { ok: true, newBalance: Number(row.remaining_credits) };
  }

  const message = typeof row.error === "string" ? row.error : "Credit deduction failed.";
  if (/insufficient/i.test(message)) {
    return { ok: false, reason: "insufficient" };
  }
  return { ok: false, reason: "error", message };
}

/**
 * Refund credits (on n8n failure, upload failure, etc).
 * Best-effort — logs but never throws so the caller's failure
 * handling can continue cleanly.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  generationId?: string,
): Promise<{ ok: boolean; newBalance?: number; message?: string }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Invalid refund amount." };
  }
  const { data, error } = await admin().rpc("refund_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_generation_id: generationId ?? null,
  });
  if (error) {
    console.error("[refundCredits] failed:", error.message, {
      userId,
      amount,
      reason,
    });
    return { ok: false, message: error.message };
  }
  return { ok: true, newBalance: Number(data) };
}

/**
 * Read-only — used by routes that need to surface the current
 * balance without modifying it. Returns null if the row doesn't
 * exist.
 */
export async function readCredits(
  userId: string,
): Promise<{ credits: number; plan: string | null } | null> {
  const { data, error } = await admin()
    .from("profiles")
    .select("credits, plan")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { credits: Number(data.credits ?? 0), plan: data.plan ?? null };
}

// ────────────────────────────────────────────────────────────
// Team credit operations — same safety guarantees as user credits.
// SQL functions live in sql/teams.sql.
// ────────────────────────────────────────────────────────────

/**
 * Atomically deduct `amount` credits from a team's shared pool.
 * Returns the new balance on success, or insufficient/error.
 */
export async function deductTeamCredits(
  teamId: string,
  actorUserId: string,
  amount: number,
  reason: string,
  generationId?: string,
): Promise<DeductResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "error", message: "Invalid credit amount." };
  }
  const { data, error } = await admin().rpc("deduct_team_credits", {
    p_team_id: teamId,
    p_actor_id: actorUserId,
    p_amount: amount,
    p_reason: reason,
    p_generation_id: generationId ?? null,
  });
  if (error) return { ok: false, reason: "error", message: error.message };
  if (data === null || data === undefined) return { ok: false, reason: "insufficient" };
  return { ok: true, newBalance: Number(data) };
}

/**
 * Refund credits back to the team pool (on n8n/upload failure).
 */
export async function refundTeamCredits(
  teamId: string,
  actorUserId: string,
  amount: number,
  reason: string,
  generationId?: string,
): Promise<{ ok: boolean; newBalance?: number; message?: string }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Invalid refund amount." };
  }
  const { data, error } = await admin().rpc("refund_team_credits", {
    p_team_id: teamId,
    p_actor_id: actorUserId,
    p_amount: amount,
    p_reason: reason,
    p_generation_id: generationId ?? null,
  });
  if (error) {
    console.error("[refundTeamCredits] failed:", error.message, { teamId, amount, reason });
    return { ok: false, message: error.message };
  }
  return { ok: true, newBalance: Number(data) };
}

/**
 * Add credits to the team pool (owner tops up from their own balance).
 * Deducts from owner's personal credits, adds to team pool atomically.
 */
export async function topupTeamFromOwner(
  teamId: string,
  ownerId: string,
  amount: number,
): Promise<DeductResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "error", message: "Invalid amount." };
  }

  // 1. Deduct from owner's personal balance
  const deduct = await deductCredits(ownerId, amount, "team_topup");
  if (!deduct.ok) return deduct;

  // 2. Add to team pool
  const { data, error } = await admin().rpc("topup_team_credits", {
    p_team_id: teamId,
    p_actor_id: ownerId,
    p_amount: amount,
    p_reason: "topup_from_owner",
  });
  if (error) {
    // Rollback: refund owner's credits if team topup failed
    await refundCredits(ownerId, amount, "refund:team_topup_failed");
    return { ok: false, reason: "error", message: error.message };
  }
  return { ok: true, newBalance: Number(data) };
}

/**
 * Read team's current credit balance and plan.
 */
export async function readTeamCredits(
  teamId: string,
): Promise<{ credits: number; plan: string } | null> {
  const { data, error } = await admin()
    .from("teams")
    .select("credits, plan")
    .eq("id", teamId)
    .maybeSingle();
  if (error || !data) return null;
  return { credits: Number(data.credits ?? 0), plan: data.plan ?? "free" };
}
