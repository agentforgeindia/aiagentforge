// ============================================================
// Small in-memory rate limiter for API routes
// ============================================================
// Stops one visitor (or one script) from hammering the endpoints
// that cost money per call — the AI analysis / OCR / chat routes
// are open to visitors who have not signed up yet, so a login
// check alone cannot protect them.
//
//   const limited = rateLimit(req, { name: "textile-ocr", limit: 30, windowMs: 10 * 60_000 });
//   if (limited) return limited;        // 429 with Retry-After
//
// Counting is per server process (the site runs as one pm2
// process on the VPS). If the app is ever scaled to several
// processes or machines, move the counters to Redis / Postgres.
// ============================================================

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 50_000;
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000 && buckets.size < MAX_BUCKETS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still too many (a flood of unique keys): drop the oldest half.
  if (buckets.size >= MAX_BUCKETS) {
    let toDrop = Math.floor(buckets.size / 2);
    for (const key of buckets.keys()) {
      if (toDrop-- <= 0) break;
      buckets.delete(key);
    }
  }
}

/**
 * The caller's IP as seen by OUR nginx.
 * `x-real-ip` is set by nginx to the connecting address. In
 * `x-forwarded-for` only the LAST entry was added by our proxy —
 * everything before it is whatever the client chose to send.
 */
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "unknown";
}

export type RateLimitOptions = {
  /** Which endpoint — counters are separate per name. */
  name: string;
  /** Requests allowed per window. */
  limit: number;
  windowMs: number;
  /** Count per signed-in user instead of per IP. */
  userId?: string | null;
};

export type RateLimitState = { allowed: boolean; remaining: number; retryAfterSeconds: number };

/** Pure counter — exported for tests. */
export function hitRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitState {
  sweep(now);
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

let warnedMissingIp = false;
function warnMissingIp() {
  if (warnedMissingIp) return;
  warnedMissingIp = true;
  console.warn(
    "[rateLimit] No x-real-ip / x-forwarded-for header — per-IP limits are OFF. " +
      "Add `proxy_set_header X-Real-IP $remote_addr;` to the nginx site config.",
  );
}

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function rateLimit(req: Request, options: RateLimitOptions): Response | null {
  const ip = clientIp(req);
  // No IP header at all means the reverse proxy is not passing it on.
  // Limiting "unknown" would put every visitor in one bucket and lock
  // the whole site out, so that case is let through (and logged once).
  if (!options.userId && ip === "unknown") {
    warnMissingIp();
    return null;
  }
  const who = options.userId ? `u:${options.userId}` : `ip:${ip}`;
  const state = hitRateLimit(`${options.name}|${who}`, options.limit, options.windowMs);
  if (state.allowed) return null;
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please wait a little and try again.",
      code: "RATE_LIMITED",
      retry_after_seconds: state.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(state.retryAfterSeconds),
      },
    },
  );
}
