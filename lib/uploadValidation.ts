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

// Largest design / product / jewellery photo a customer may upload from
// the agent pages. (The storage bucket itself allows more, because the
// generated Ultra HD outputs are stored there too.)
export const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
export const SOURCE_IMAGE_TOO_LARGE_MESSAGE =
  "This image is larger than 20 MB. Please upload a smaller JPG or PNG (a phone photo or a 2000–3000 px export works best).";

/** First file that is too large to upload as a generation input, if any. */
export function findOversizedSourceImage(files: File[]): File | null {
  return files.find((file) => file.size > MAX_SOURCE_IMAGE_BYTES) ?? null;
}

// ── Formats a customer may upload as a generation input ──────
// The storage rules (sql/pending/…-storage-per-user.sql) accept only
// these file extensions from the browser, inside the uploader's own
// folder — keep the two lists the same.
export const ALLOWED_SOURCE_IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "jfif", "png", "webp", "avif", "heic", "heif", "tif", "tiff",
] as const;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/tiff": "tiff",
};

export const SOURCE_IMAGE_UNSUPPORTED_MESSAGE =
  "This file type is not supported. Please upload a JPG, PNG, WebP, AVIF, HEIC or TIFF image.";

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function isAllowedSourceExtension(ext: string): boolean {
  return (ALLOWED_SOURCE_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

/** Can this file be uploaded as a generation input? (by extension, else by type) */
export function isSupportedSourceImage(file: File): boolean {
  if (isAllowedSourceExtension(extensionOf(file.name))) return true;
  return Boolean(EXTENSION_BY_MIME[(file.type || "").toLowerCase()]);
}

/** First file that is not an accepted image format, if any. */
export function findUnsupportedSourceImage(files: File[]): File | null {
  return files.find((file) => !isSupportedSourceImage(file)) ?? null;
}

/**
 * A storage-safe file name that always ends in an accepted extension.
 * Phone cameras sometimes hand over a file called just "image" — the
 * extension is then taken from the file's type.
 */
export function storageSafeName(file: File): string {
  const cleaned = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").slice(-80) || "upload";
  if (isAllowedSourceExtension(extensionOf(cleaned))) return cleaned;
  const fromType = EXTENSION_BY_MIME[(file.type || "").toLowerCase()];
  return fromType ? `${cleaned.replace(/\.+$/, "")}.${fromType}` : cleaned;
}

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

// Trusted hosts — matched exactly, never by "starts with" / "ends with":
//   • our own Supabase project host (from NEXT_PUBLIC_SUPABASE_URL),
//   • aiagentforge.in and its real sub-domains,
//   • hosts listed in NEXT_PUBLIC_TRUSTED_IMAGE_HOSTS (exact host, or
//     ".example.com" for a domain with its sub-domains),
// and only over https.

const OWN_DOMAIN = "aiagentforge.in";

function ownSupabaseHost(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  try {
    return new URL(base).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function extraTrustedHosts(): string[] {
  const extra = process.env.NEXT_PUBLIC_TRUSTED_IMAGE_HOSTS;
  if (!extra) return [];
  return extra
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/** `host` is `domain` itself or a real sub-domain of it. */
function isDomainOrSubdomain(host: string, domain: string): boolean {
  const bare = domain.replace(/^\./, "");
  return host === bare || host.endsWith(`.${bare}`);
}

export function isAgentForgeHostedUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== "string" || rawUrl.length === 0 || rawUrl.length > 2048) return false;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  // No credentials or odd ports hidden in the address.
  if (parsed.username || parsed.password) return false;
  if (parsed.port && parsed.port !== "443") return false;

  const host = parsed.hostname.toLowerCase();
  if (host === ownSupabaseHost()) return true;
  if (isDomainOrSubdomain(host, OWN_DOMAIN)) return true;
  return extraTrustedHosts().some((entry) =>
    entry.startsWith(".") ? isDomainOrSubdomain(host, entry) : host === entry,
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
