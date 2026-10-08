// ============================================================
// Creator (influencer) portal — server-side session
// ============================================================
// A creator's record id is not a secret (the public Influencer Hub
// lists creators), so the id alone must never open anything. The
// portal works with a signed session token:
//   • it is issued only after the person proves who they are
//     (registered email + registered mobile number together), or
//     at the moment a brand-new application is created;
//   • every creator API checks the token AND that it belongs to
//     the creator record being read or changed;
//   • it is an HMAC-signed value — the server needs no extra table.
//
// Secret: INFLUENCER_SESSION_SECRET (any long random string). If it
// is not set, a key is derived from the service-role key, so the
// portal keeps working; sessions then end when that key is rotated.
//
// Server only.
// ============================================================

import { createHmac, timingSafeEqual } from "node:crypto";

import { adminFromAuthHeader } from "@/lib/adminAuth";

export const INFLUENCER_TOKEN_HEADER = "x-af-influencer";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function signingKey(): Buffer | null {
  const dedicated = process.env.INFLUENCER_SESSION_SECRET?.trim();
  if (dedicated && dedicated.length >= 16) return Buffer.from(dedicated, "utf8");
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!service) return null;
  return createHmac("sha256", service).update("af-influencer-session-v1").digest();
}

const b64url = (buf: Buffer) => buf.toString("base64url");

function sign(payload: string, key: Buffer): string {
  return b64url(createHmac("sha256", key).update(payload).digest());
}

/** A session token for one creator record. Null if the server has no key. */
export function issueInfluencerToken(
  candidateId: string,
  ttlSeconds: number = SESSION_TTL_SECONDS,
  now: number = Date.now(),
): string | null {
  const key = signingKey();
  if (!key || !UUID_RE.test(candidateId)) return null;
  const payload = b64url(
    Buffer.from(JSON.stringify({ cid: candidateId.toLowerCase(), exp: Math.floor(now / 1000) + ttlSeconds })),
  );
  return `${payload}.${sign(payload, key)}`;
}

/** The creator id inside a valid, unexpired token — otherwise null. */
export function readInfluencerToken(token: unknown, now: number = Date.now()): string | null {
  if (typeof token !== "string" || token.length > 400) return null;
  const key = signingKey();
  if (!key) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      cid?: unknown;
      exp?: unknown;
    };
    if (typeof data.cid !== "string" || !UUID_RE.test(data.cid)) return null;
    if (typeof data.exp !== "number" || data.exp * 1000 < now) return null;
    return data.cid;
  } catch {
    return null;
  }
}

/** The creator this request is signed in as (from the token header). */
export function influencerFromRequest(req: Request): string | null {
  return readInfluencerToken(req.headers.get(INFLUENCER_TOKEN_HEADER));
}

export type InfluencerAccess = "self" | "admin" | null;

/**
 * May this request act on creator record `candidateId`?
 *   "self"  — signed in as that creator.
 *   "admin" — a team member with access to the Influencer screens
 *             (only when `allowAdmin` is set; used for READ access so
 *             "Open dashboard" in the admin panel keeps working).
 */
export async function authorizeInfluencer(
  req: Request,
  candidateId: unknown,
  options: { allowAdmin?: boolean } = {},
): Promise<InfluencerAccess> {
  if (typeof candidateId !== "string" || !UUID_RE.test(candidateId)) return null;
  const signedIn = influencerFromRequest(req);
  if (signedIn && signedIn === candidateId.toLowerCase()) return "self";
  if (options.allowAdmin) {
    const admin = await adminFromAuthHeader(req.headers.get("authorization"), [
      "marketing.view",
      "hr.view",
      "finance.view",
    ]);
    if (admin) return "admin";
  }
  return null;
}

export function influencerDenied(): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      code: "INFLUENCER_LOGIN_REQUIRED",
      error: "Please log in to your creator dashboard again.",
    }),
    { status: 401, headers: { "Content-Type": "application/json" } },
  );
}

/** Digits only, last 10 — so "+91 98765 43210" matches "9876543210". */
export function mobileKey(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}
