// ============================================================
// App content — banners and offers shown inside the Android app.
// ============================================================
// Shared by the server routes, the app screens and the admin page,
// so all three agree on what an item is and when it is live.
//
//   table            sql/app-content.sql (public.app_content)
//   public read      GET /api/app-content
//   admin manage     /api/admin/app-content  →  /admin/app-content
//   app screens      app/components/appshell/AppPromos.tsx
// ============================================================

export type AppContentKind = "banner" | "offer";
export type AppContentAudience = "all" | "guests" | "members";

/** What the app needs to draw an item. */
export type AppContentItem = {
  id: string;
  kind: AppContentKind;
  title: string;
  body: string | null;
  /** Offer only: short highlight on the ticket stub ("20% extra"). */
  badge: string | null;
  image_url: string | null;
  cta_label: string | null;
  /** "/billing" style path, or a full https:// link. */
  link: string | null;
  /** Banner only: false = picture only (text is already in the artwork). */
  show_text: boolean;
  audience: AppContentAudience;
  starts_at: string | null;
  ends_at: string | null;
};

/** Full row, as the admin page sees it. */
export type AppContentRow = AppContentItem & {
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const APP_CONTENT_COLUMNS =
  "id, kind, title, body, badge, image_url, cta_label, link, show_text, audience, starts_at, ends_at";
export const APP_CONTENT_ADMIN_COLUMNS = `${APP_CONTENT_COLUMNS}, is_active, sort_order, created_by, created_at, updated_at`;

/** Text limits — kept short so nothing gets cut off on a phone. */
export const APP_CONTENT_LIMITS = { title: 60, body: 140, badge: 14, cta: 22, link: 300 } as const;

/** How many live items the app shows at most. */
export const APP_CONTENT_MAX = { banner: 6, offer: 3 } as const;

export type AppContentStatus = "live" | "scheduled" | "ended" | "paused";

/** Is this item showing in the app right now? */
export function appContentStatus(
  row: Pick<AppContentRow, "is_active" | "starts_at" | "ends_at">,
  now: number = Date.now(),
): AppContentStatus {
  if (!row.is_active) return "paused";
  if (row.ends_at && new Date(row.ends_at).getTime() <= now) return "ended";
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return "scheduled";
  return "live";
}

export function isForAudience(audience: AppContentAudience, loggedIn: boolean): boolean {
  if (audience === "guests") return !loggedIn;
  if (audience === "members") return loggedIn;
  return true;
}

const OWN_HOSTS = new Set(["aiagentforge.in", "www.aiagentforge.in"]);

/**
 * Cleans a link typed by an admin.
 *   ""                      → null (no link)
 *   "/billing"              → "/billing"
 *   "https://www.aiagentforge.in/gallery" → "/gallery" (stays inside the app)
 *   "https://example.com/x" → kept as is (opens in the browser)
 * Returns `false` when the link is not allowed.
 */
export function cleanAppLink(raw: unknown): string | null | false {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (value.length > APP_CONTENT_LIMITS.link) return false;
  if (value.startsWith("/")) {
    if (value.startsWith("//") || /[\s\\]/.test(value)) return false;
    return value;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (OWN_HOSTS.has(url.hostname.toLowerCase())) return `${url.pathname}${url.search}${url.hash}` || "/";
    return url.toString();
  } catch {
    return false;
  }
}

export const isExternalLink = (link: string | null | undefined): boolean => !!link && /^https:\/\//i.test(link);

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Ends today", "2 days left", "Ends 21 Oct" — or null when there is no end date. */
export function endsLabel(endsAt: string | null | undefined, now: number = Date.now()): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(end) || end <= now) return null;
  const left = end - now;
  if (left < 60 * 60 * 1000) return "Ends within the hour";
  if (left < DAY_MS) return `${Math.floor(left / (60 * 60 * 1000))} hours left`;
  const days = Math.floor(left / DAY_MS);
  if (days === 1) return "1 day left";
  if (days <= 7) return `${days} days left`;
  return `Ends ${new Date(end).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}
