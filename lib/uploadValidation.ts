// ============================================================
// AgentForge upload + URL validation helpers
// ============================================================
// Two distinct uses:
//   1. Client / admin uploads        → isAllowedImageMime / sizeOk
//   2. Server-side payload sanity    → isAgentForgeHostedUrl
//
// The second one is the security-critical piece — generate API
// routes accept image URLs in the body and forward them to n8n.
// Without this check, an attacker could send arbitrary external
// URLs and (a) use our compute budget to hot-link or (b) point
// the AI pipeline at SSRF targets.
// ============================================================

// ────────────────────────────────────────────────────────────
// MIME + size for browser-side uploads (Storage policies + admin form)
// ────────────────────────────────────────────────────────────

export const ALLOWED_IMAGE_MIME = new Set<string>([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB — generation inputs
export const MAX_HERO_BYTES = 5 * 1024 * 1024;    //  5 MB — post hero image

export function isAllowedImageMime(mime: string | null | undefined): boolean {
  return !!mime && ALLOWED_IMAGE_MIME.has(mime.toLowerCase());
}

export function isUploadSizeOk(
  bytes: number,
  max: number = MAX_UPLOAD_BYTES,
): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= max;
}

/** Convenience: validate a File in one call. */
export function validateImageFile(
  file: File,
  maxBytes: number = MAX_UPLOAD_BYTES,
): { ok: true } | { ok: false; reason: string } {
  if (!isAllowedImageMime(file.type)) {
    return { ok: false, reason: "Only JPG, PNG, WebP or AVIF images are allowed." };
  }
  if (!isUploadSizeOk(file.size, maxBytes)) {
    return {
      ok: false,
      reason: `Image must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`,
    };
  }
  return { ok: true };
}

// ────────────────────────────────────────────────────────────
// Server-side URL allowlist
// ────────────────────────────────────────────────────────────
// We only forward image URLs to n8n if they are URLs WE host
// (Supabase Storage in our project, or other approved CDNs).
// Set extra hosts in NEXT_PUBLIC_TRUSTED_IMAGE_HOSTS if needed.
// ────────────────────────────────────────────────────────────

const STATIC_TRUSTED_HOST_SUFFIXES = [
  ".supabase.co",
  ".supabase.in",
  "aiagentforge.in",
];

function trustedHostSuffixes(): string[] {
  const extra = process.env.NEXT_PUBLIC_TRUSTED_IMAGE_HOSTS;
  if (!extra) return STATIC_TRUSTED_HOST_SUFFIXES;
  return [
    ...STATIC_TRUSTED_HOST_SUFFIXES,
    ...extra
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  ];
}

export function isAgentForgeHostedUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) return false;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  const host = parsed.hostname.toLowerCase();
  return trustedHostSuffixes().some(
    (suf) => host === suf.replace(/^\./, "") || host.endsWith(suf),
  );
}

/**
 * Bulk check — used when the generate routes accept an array of
 * source image URLs. Returns the first failing URL or null.
 */
export function firstUntrustedUrl(urls: unknown[]): string | null {
  for (const u of urls) {
    if (!isAgentForgeHostedUrl(u)) return typeof u === "string" ? u : "(non-string)";
  }
  return null;
}
