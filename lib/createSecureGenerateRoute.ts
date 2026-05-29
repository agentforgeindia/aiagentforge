// ============================================================
// createSecureGenerateRoute
// ============================================================
// One factory that produces a secure POST handler for any agent's
// generate endpoint. New agents stop reimplementing auth, URL
// validation, atomic credit deduction, generations row insertion,
// n8n forwarding, and refund-on-failure — they just plug in a
// config object.
//
// Used by:
//   • app/api/jewellery/generate
//   • app/api/textile/generate
//   • app/api/productography/generate
//   • app/api/<future-agent>/generate     ← copy template
//
// Why this exists:
//   Pillar 5 (Security) audit found the old per-agent routes had
//   diverged — some trusted body.user_id, some skipped URL checks,
//   some deducted client-side. This factory makes drift impossible:
//   one bug fix here = every agent fixed.
//
// What it always does (you can't opt out):
//   1. requireUser(req) — 401 if no/invalid JWT.
//   2. JSON body parse + caller's validate() — 400 on bad body.
//   3. Validate all URL inputs are AgentForge-hosted (no SSRF).
//   4. Atomic credit deduction (if creditMode === "server")
//      — 402 on insufficient.
//   5. Insert generations row server-side with verified user_id
//      — 500 on DB error, refund credits if any were deducted.
//   6. POST to n8n with user_id overwritten to the verified value
//      — 502 / refund on n8n unreachable, refund on n8n 4xx/5xx.
//   7. Return { success, generation_id, new_balance, … } on OK.
//
// Two credit modes:
//   • "server" — this route calls deduct_credits()/refund_credits()
//     directly (used by jewellery: we don't trust n8n with billing).
//   • "n8n"    — n8n owns the deduction inside the workflow
//     (used by textile/productography during the migration). The
//     route still validates auth + URLs + inserts the generation
//     row, but doesn't touch credits.
// ============================================================

import { NextResponse } from "next/server";

import { requireUser, type AuthedUser } from "@/lib/serverAuth";
import { deductCredits, refundCredits } from "@/lib/creditsServer";
import {
  isAgentForgeHostedUrl,
  firstUntrustedUrl,
} from "@/lib/uploadValidation";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type AgentSlug =
  | "jewellery"
  | "textile"
  | "productography"
  | "ugc-forge"
  | "trendforge"
  | (string & {}); // open to future agents

export type GenerationMode = "single" | "bulk";

export type BodyValidationResult<T> =
  | { ok: true; body: T }
  | { ok: false; error: string; status?: number };

export type GenerationRow = {
  id: string;
  user_id: string;
  status: "pending";
  [k: string]: unknown;
};

export type SecureRouteConfig<TBody> = {
  /** Slug used in audit log + generations.agent_type column. */
  agentSlug: AgentSlug;

  /** Human label for the audit log (`reason` in credit_transactions). */
  reasonLabel: string;

  /** Env-var names tried in order to resolve the n8n webhook URL. */
  webhookEnvVars: string[];

  /**
   * Who deducts credits.
   *   "server" — this route deducts atomically before forwarding.
   *   "n8n"    — the workflow handles credits; this route does not.
   */
  creditMode: "server" | "n8n";

  /** Per-call safety cap on required_credits. */
  maxCreditsPerCall: number;

  /** Maximum items in a bulk request (ignored for single-mode-only agents). */
  maxBulkItems?: number;

  /**
   * Caller-supplied body validator. Should:
   *   • narrow `body` to the agent's expected shape,
   *   • return any HTTP status (defaults to 400).
   * Auth + URL checks have NOT yet run — focus on shape/types.
   */
  validateBody: (raw: unknown) => BodyValidationResult<TBody>;

  /**
   * Return every URL in the body that we will eventually pass to
   * n8n / AI. The factory validates each is AgentForge-hosted
   * (no external SSRF).
   */
  collectUrls: (body: TBody) => string[];

  /** Build the generations row(s) inserted before forwarding. */
  buildGenerationRows: (body: TBody, userId: string) => GenerationRow[];

  /**
   * Build the JSON payload forwarded to n8n. The factory already
   * stamps user_id from the JWT into the result before sending —
   * you can ignore that field here.
   */
  buildForwardPayload: (body: TBody, userId: string) => Record<string, unknown>;

  /**
   * For single-mode requests, return the generation_id to put in
   * the response. For bulk-mode, return the batch_id (used as
   * audit anchor in credit_transactions).
   */
  pickAuditId: (body: TBody) => string | null;

  /**
   * Optional — extra fields to return to the client on success.
   * Always: success, generation_id, new_balance (if creditMode=server).
   */
  extraResponseFields?: (
    body: TBody,
    user: AuthedUser,
    n8nResponse: unknown,
  ) => Record<string, unknown>;
};

// ────────────────────────────────────────────────────────────
// Service-role REST insert (no @supabase/supabase-js dependency).
// Keeps the factory leaf-light.
// ────────────────────────────────────────────────────────────

async function insertGenerationRows(rows: GenerationRow[]): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service-role env vars missing.");
  }
  const response = await fetch(`${url}/rest/v1/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`generations insert failed: ${text}`);
  }
}

// ────────────────────────────────────────────────────────────
// Factory
// ────────────────────────────────────────────────────────────

export function createSecureGenerateRoute<TBody>(
  cfg: SecureRouteConfig<TBody>,
) {
  return async function POST(request: Request) {
    // 1. Auth.
    const userOrResp = await requireUser(request);
    if (userOrResp instanceof Response) return userOrResp;
    const user = userOrResp;

    // 2. n8n URL.
    const webhookUrl = cfg.webhookEnvVars
      .map((name) => process.env[name])
      .find((v) => typeof v === "string" && /^https?:\/\//i.test(v as string));
    if (!webhookUrl) {
      return NextResponse.json(
        {
          error: `${cfg.agentSlug} webhook URL is not configured. Set one of: ${cfg.webhookEnvVars.join(", ")}.`,
        },
        { status: 500 },
      );
    }

    // 3. Parse + validate body shape.
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const v = cfg.validateBody(raw);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: v.status ?? 400 });
    }
    const body = v.body;

    // 4. URL allowlist — SSRF and hot-link block.
    const urls = cfg.collectUrls(body).filter(Boolean);
    const untrusted = firstUntrustedUrl(urls);
    if (untrusted) {
      return NextResponse.json(
        {
          error: `URL is not AgentForge-hosted: ${untrusted}. Only Supabase / aiagentforge.in URLs allowed.`,
        },
        { status: 400 },
      );
    }

    // 5. Validate required_credits range (single source of truth — no agent
    // can quietly raise its own cap).
    const requiredCredits = Number(
      (body as any)?.required_credits ?? (body as any)?.credits_required ?? 0,
    );
    if (
      cfg.creditMode === "server" &&
      (!Number.isFinite(requiredCredits) ||
        requiredCredits <= 0 ||
        requiredCredits > cfg.maxCreditsPerCall)
    ) {
      return NextResponse.json(
        {
          error: `required_credits must be a positive integer ≤ ${cfg.maxCreditsPerCall}.`,
        },
        { status: 400 },
      );
    }

    const auditId = cfg.pickAuditId(body);

    // 6. Atomic deduction (server mode only).
    let newBalance: number | null = null;
    if (cfg.creditMode === "server") {
      const deduct = await deductCredits(
        user.id,
        requiredCredits,
        cfg.reasonLabel,
        auditId ?? undefined,
      );
      if (!deduct.ok) {
        if (deduct.reason === "insufficient") {
          return NextResponse.json(
            { error: "Not enough credits.", code: "INSUFFICIENT_CREDITS" },
            { status: 402 },
          );
        }
        return NextResponse.json(
          { error: deduct.message || "Credit deduction failed." },
          { status: 500 },
        );
      }
      newBalance = deduct.newBalance;
    }

    // 7. Generations row(s) — server holds the source of truth.
    try {
      await insertGenerationRows(cfg.buildGenerationRows(body, user.id));
    } catch (err: any) {
      if (cfg.creditMode === "server") {
        await refundCredits(
          user.id,
          requiredCredits,
          `refund:${cfg.agentSlug}_row_insert_failed`,
          auditId ?? undefined,
        );
      }
      return NextResponse.json(
        { error: err?.message || "Failed to register generation." },
        { status: 500 },
      );
    }

    // 8. Forward to n8n. user_id is always overwritten to the verified one
    // — agents cannot accidentally trust a client-supplied id.
    const forwarded = {
      ...cfg.buildForwardPayload(body, user.id),
      user_id: user.id,
    };

    let response: Response;
    try {
      response = await fetch(webhookUrl as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forwarded),
        cache: "no-store",
      });
    } catch (err: any) {
      if (cfg.creditMode === "server") {
        await refundCredits(
          user.id,
          requiredCredits,
          `refund:${cfg.agentSlug}_n8n_network_error`,
          auditId ?? undefined,
        );
      }
      return NextResponse.json(
        { error: err?.message || "n8n unreachable." },
        { status: 502 },
      );
    }

    const text = await response.text();
    let n8nData: any = null;
    try {
      n8nData = text ? JSON.parse(text) : null;
    } catch {
      n8nData = { raw: text };
    }

    if (!response.ok) {
      if (cfg.creditMode === "server") {
        await refundCredits(
          user.id,
          requiredCredits,
          `refund:${cfg.agentSlug}_n8n_error`,
          auditId ?? undefined,
        );
      }
      return NextResponse.json(
        {
          error:
            n8nData?.error ||
            n8nData?.message ||
            `n8n error ${response.status}`,
          details: n8nData,
        },
        { status: response.status },
      );
    }

    // 9. Success — single response shape across every agent.
    const extra = cfg.extraResponseFields?.(body, user, n8nData) ?? {};
    return NextResponse.json({
      success: true,
      agent: cfg.agentSlug,
      generation_id: auditId,
      new_balance: newBalance,
      webhook_response: n8nData,
      ...extra,
    });
  };
}

// ────────────────────────────────────────────────────────────
// Small helpers exported for use inside config callbacks.
// ────────────────────────────────────────────────────────────

/** Check `value` looks like a UUIDish string (32-40 chars of hex/hyphens). */
export function isUuidish(value: unknown): value is string {
  return (
    typeof value === "string" && /^[0-9a-f-]{32,40}$/i.test(value)
  );
}

/** Re-export so callers don't need a second import. */
export { isAgentForgeHostedUrl };
