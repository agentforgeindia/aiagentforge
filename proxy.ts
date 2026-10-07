// ============================================================
// proxy.ts — runs before every /api/* request (Next.js "Proxy",
// the new name for middleware; Node.js runtime).
// ============================================================
// A coarse flood guard for the whole API: one address cannot send
// more than a set number of requests per minute. The endpoints
// that cost money per call have their own, tighter limits inside
// the route (lib/rateLimit.ts) — this is the outer wall for the
// many public form endpoints (careers, workshop, demo request…).
//
// Not limited here:
//   • payment / lead webhooks and cron calls — they come from
//     Razorpay, Meta, Google and our own VPS, and prove themselves
//     with a signature or secret.
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { rateLimit } from "@/lib/rateLimit";

const WINDOW_MS = 60_000;
const WRITES_PER_MINUTE = 120;
const READS_PER_MINUTE = 600;

const UNLIMITED_PREFIXES = ["/api/razorpay/webhook", "/api/webhooks/", "/api/cron/"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (UNLIMITED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  const isRead = request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS";
  const limited = rateLimit(request, {
    name: isRead ? "api-read" : "api-write",
    limit: isRead ? READS_PER_MINUTE : WRITES_PER_MINUTE,
    windowMs: WINDOW_MS,
  });
  return limited ?? NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
