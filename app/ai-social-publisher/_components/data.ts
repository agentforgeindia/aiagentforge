// ============================================================
// AI Social Publisher (Scheduler) — LAYOUT PREVIEW data
// ============================================================
// Dummy data only. Nothing here talks to any social platform.
// "My Creations" picker reads the logged-in user's real
// AgentForge generations (read-only) and falls back to the
// public gallery samples below when there are none.
// ============================================================

export type PlatformId = "instagram" | "facebook" | "youtube" | "linkedin" | "x" | "pinterest";

export type PostStatus = "draft" | "scheduled" | "published" | "partially_published" | "failed" | "cancelled";

export type Account = {
  id: string;
  platform: PlatformId;
  name: string;
  type: string;
  status: "connected" | "needs_reauth";
};

export type Media = { id: string; url: string; source: "device" | "creation"; kind: "image" | "video" };

export type Post = {
  id: string;
  caption: string;
  media: Media[];
  accountIds: string[];
  at: string | null; // ISO; null = draft without time
  status: PostStatus;
  results?: { accountId: string; ok: boolean; error?: string }[];
};

export const PLATFORM_NAME: Record<PlatformId, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X",
  pinterest: "Pinterest",
};

export const PLATFORM_LIST: { id: PlatformId; note: string; available: boolean }[] = [
  { id: "instagram", note: "Business / Creator account", available: true },
  { id: "facebook", note: "Facebook Page", available: true },
  { id: "youtube", note: "Channel (video posts)", available: false },
  { id: "linkedin", note: "Profile / Company page", available: false },
  { id: "x", note: "Profile", available: false },
  { id: "pinterest", note: "Boards", available: false },
];

export const CAPTION_LIMIT: Record<PlatformId, number> = {
  instagram: 2200,
  facebook: 5000,
  youtube: 5000,
  linkedin: 3000,
  x: 280,
  pinterest: 500,
};

export const SAMPLE_ACCOUNTS: Account[] = [
  { id: "acc-ig-1", platform: "instagram", name: "riyasilks", type: "Instagram Business", status: "connected" },
  { id: "acc-fb-1", platform: "facebook", name: "Riya Silks", type: "Facebook Page", status: "connected" },
  { id: "acc-ig-2", platform: "instagram", name: "riyasilks.bridal", type: "Instagram Business", status: "needs_reauth" },
];

/** Public AgentForge gallery outputs — stand-ins for "My Creations" when the user has none. */
export const SAMPLE_CREATIONS: { id: string; url: string; agent: "Textile" | "Jewellery" | "Productography" }[] = [
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ id: `jw-${n}`, url: `/gallery/jewellery/design-${n}.png`, agent: "Jewellery" as const })),
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ id: `pr-${n}`, url: `/gallery/productography/design-${n}.png`, agent: "Productography" as const })),
];

const img = (id: string, url: string): Media => ({ id, url, source: "creation", kind: "image" });

/** Sample posts relative to "now" (built on the client only, after mount). */
export function buildSamplePosts(now: Date): Post[] {
  const at = (dayOffset: number, h: number, m: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  return [
    { id: "p1", caption: "Diwali Edit is live ✨ Handwoven silk, real zari. DM to order.", media: [img("m1", "/gallery/jewellery/design-1.png")], accountIds: ["acc-ig-1", "acc-fb-1"], at: at(1, 11, 0), status: "scheduled" },
    { id: "p2", caption: "New bridal set drop — book your try-on this weekend.", media: [img("m2", "/gallery/jewellery/design-2.png"), img("m3", "/gallery/jewellery/design-3.png")], accountIds: ["acc-ig-1"], at: at(2, 19, 30), status: "scheduled" },
    { id: "p3", caption: "Customer love 💛 Thank you Meera for the lovely review!", media: [img("m4", "/gallery/productography/design-1.png")], accountIds: ["acc-ig-1", "acc-fb-1"], at: at(0, 9, 30), status: "published", results: [{ accountId: "acc-ig-1", ok: true }, { accountId: "acc-fb-1", ok: true }] },
    { id: "p4", caption: "Festive colours carousel — which one is your favourite?", media: [img("m5", "/gallery/productography/design-2.png")], accountIds: ["acc-ig-1", "acc-fb-1"], at: at(-2, 18, 0), status: "partially_published", results: [{ accountId: "acc-ig-1", ok: true }, { accountId: "acc-fb-1", ok: false, error: "Facebook ne image reject ki (size). Retry karo ya image badlo." }] },
    { id: "p5", caption: "Weekend flash sale — 2 days only.", media: [img("m6", "/gallery/productography/design-3.png")], accountIds: ["acc-ig-2"], at: at(-1, 12, 0), status: "failed", results: [{ accountId: "acc-ig-2", ok: false, error: "Account ka login expire ho gaya — Reconnect karo." }] },
    { id: "p6", caption: "Kurti collection teaser (draft)", media: [img("m7", "/gallery/jewellery/design-4.png")], accountIds: ["acc-ig-1"], at: at(4, 10, 0), status: "draft" },
    { id: "p7", caption: "Navratri look book", media: [img("m8", "/gallery/productography/design-4.png")], accountIds: ["acc-fb-1"], at: at(3, 17, 0), status: "scheduled" },
  ];
}

/** Theme-only status colours — no orange / red. */
export const STATUS_META: Record<PostStatus, { label: string; pill: string; dot: string }> = {
  draft: { label: "Draft", pill: "bg-slate-500/10 text-slate-600 dark:text-slate-300", dot: "bg-slate-400" },
  scheduled: { label: "Scheduled", pill: "bg-blue-500/10 text-blue-600 dark:text-blue-300", dot: "bg-blue-500" },
  published: { label: "Published", pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300", dot: "bg-emerald-500" },
  partially_published: { label: "Partly published", pill: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300", dot: "bg-cyan-500" },
  failed: { label: "Needs attention", pill: "bg-violet-500/10 text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  cancelled: { label: "Cancelled", pill: "bg-slate-500/10 text-slate-500 line-through", dot: "bg-slate-300" },
};
