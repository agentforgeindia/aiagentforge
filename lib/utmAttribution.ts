// ============================================================
// UTM attribution helper
// ============================================================
// Captures utm_source/medium/campaign/content/term from the URL
// the first time a visitor lands on the site, plus the document
// referrer and the landing path. Stored in localStorage with a
// 30-day TTL so we can still attribute a signup that happens a
// few days after the ad click.
//
// First-touch attribution: once a record is stored, later visits
// without UTM params do NOT overwrite it. Later visits WITH new
// UTM params DO overwrite (most-recent-touch wins for re-targeting).
// ============================================================

const STORAGE_KEY = "af_utm_v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type UtmRecord = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  landing_path?: string;
  first_seen_at: string; // ISO
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

/** Pull UTMs from the current URL. Returns null if none present. */
function readUtmFromUrl(): Partial<UtmRecord> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  let found = false;
  const out: Partial<UtmRecord> = {};
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) {
      out[k] = v;
      found = true;
    }
  }
  return found ? out : null;
}

function readStored(): UtmRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UtmRecord;
    if (!parsed?.first_seen_at) return null;
    const age = Date.now() - new Date(parsed.first_seen_at).getTime();
    if (age > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(rec: UtmRecord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // ignore quota errors
  }
}

/**
 * Capture UTMs on the current page. Call once per page-load
 * (e.g. from a mounted client component in LayoutClient).
 *
 * Strategy:
 *  • If the URL has UTM params → record those + referrer + path,
 *    overwriting any previous record (latest-touch).
 *  • Else if nothing is stored yet → still record referrer + path
 *    so we at least know how the visitor arrived.
 *  • Else → leave the existing record alone.
 */
export function captureUtmOnLanding(): void {
  if (typeof window === "undefined") return;

  const fromUrl = readUtmFromUrl();
  const existing = readStored();

  if (fromUrl) {
    const rec: UtmRecord = {
      ...fromUrl,
      referrer:
        typeof document !== "undefined" && document.referrer
          ? document.referrer.slice(0, 500)
          : existing?.referrer,
      landing_path:
        typeof window !== "undefined"
          ? window.location.pathname.slice(0, 500)
          : existing?.landing_path,
      first_seen_at: new Date().toISOString(),
    };
    writeStored(rec);
    return;
  }

  if (!existing) {
    const rec: UtmRecord = {
      referrer:
        typeof document !== "undefined" && document.referrer
          ? document.referrer.slice(0, 500)
          : undefined,
      landing_path:
        typeof window !== "undefined"
          ? window.location.pathname.slice(0, 500)
          : undefined,
      first_seen_at: new Date().toISOString(),
    };
    writeStored(rec);
  }
}

/**
 * Read the currently stored attribution for sending up with
 * signup / profile-create. Returns an empty object when nothing
 * has been recorded — safe to spread into a profile insert.
 */
export function getStoredUtm(): Omit<UtmRecord, "first_seen_at"> & {
  first_seen_at?: string;
} {
  const stored = readStored();
  if (!stored) return {};
  // Shallow copy so callers can mutate without touching storage.
  return { ...stored };
}

/** Manually clear the stored record (use after successful save). */
export function clearStoredUtm(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
