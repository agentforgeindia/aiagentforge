// ============================================================
// Shared-secret check for /api/cron/* routes.
// ============================================================
// The caller (a systemd timer / cron on the VPS) sends
//   Authorization: Bearer <CRON_SECRET>
// If CRON_SECRET is not set the route refuses everything — an
// unset secret must never mean "open to the internet".
// ============================================================

import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Constant-time comparison that does not leak the secret's length. */
export function secretsMatch(given: string, expected: string): boolean {
  if (!given || !expected) return false;
  return timingSafeEqual(digest(given), digest(expected));
}

export function authorizedCron(req: Request): boolean {
  const expected = (process.env.CRON_SECRET ?? "").trim();
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  return secretsMatch(match[1].trim(), expected);
}
