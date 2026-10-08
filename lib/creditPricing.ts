// ============================================================
// Credit pricing — ONE price table for Textile, Jewellery and
// Productography
// ============================================================
// PRICE_TABLE below is the only place a credit price is written.
//   • The agent pages read it to show the price (button, summary
//     rows, "+2 credits" hints) through `perImageCredits()` and
//     `creditsLabel()`.
//   • The generate routes read it to decide what is charged: they
//     recompute the price from the options in the request and clamp
//     whatever the browser sent into the allowed range. The server
//     is the authority — the browser's number is never trusted.
//
//   floor   = quality/size base + own model + own scene
//             (everything the server can see in the payload)
//   ceiling = floor + the branding add-ons
//
// Branding (logo / name / phone / website / address) is drawn on a
// canvas in the browser and never reaches the server, so it is the
// only part still declared by the client — bounded to its real
// maximum. An honest browser always lands inside [floor, ceiling],
// so what the user sees on the button is exactly what is charged.
//
// To change a price: change PRICE_TABLE. Nothing else.
// ============================================================

export type CreditRange = { floor: number; ceiling: number };

/** A request body — every field is untrusted until checked. */
type Bag = Record<string, unknown>;

// ── The price table (credits per image) ─────────────────────
// Proposed baseline of 2026-10-08. Final numbers wait for the
// provider-cost / margin review; do not change them without it.
export const PRICE_TABLE = {
  /** Premium quality, square / 1080px. */
  premium: 15,
  /** Ultra HD quality, square / 1080px. */
  ultra: 30,
  /** Mobile 1080x1920 (and Productography landscape 1920x1080): added to the base. */
  mobileExtra: 2,
  /** Customer uploads their own scene / backdrop photo. */
  ownScene: 2,
  /** Customer uploads their own model / person photo. */
  ownModel: 2,
  /** Each branding item put on the image. */
  brandingItem: 1,
} as const;

/** Branding items each agent can put on an image (and charges for). */
export const BRANDING_ITEMS = {
  textile: ["company name", "phone", "website", "address"],
  jewellery: ["logo", "company name", "phone", "website", "address"],
  productography: ["logo", "company name", "phone", "website", "address"],
} as const;

export type PricedAgent = keyof typeof BRANDING_ITEMS;

/** Plans that get the branding items at no extra credits. */
export const BRANDING_FREE_PLANS = ["empire", "founder", "unlimited"] as const;

export type ImageOptions = {
  ultra: boolean;
  mobile: boolean;
  ownScene?: boolean;
  ownModel?: boolean;
  /** How many branding items are charged (0 on a branding-free plan). */
  brandingItems?: number;
};

/** Credits for ONE image with these options. Pages and routes both use this. */
export function perImageCredits(o: ImageOptions): number {
  return (
    (o.ultra ? PRICE_TABLE.ultra : PRICE_TABLE.premium) +
    (o.mobile ? PRICE_TABLE.mobileExtra : 0) +
    (o.ownScene ? PRICE_TABLE.ownScene : 0) +
    (o.ownModel ? PRICE_TABLE.ownModel : 0) +
    Math.max(0, Math.floor(o.brandingItems ?? 0)) * PRICE_TABLE.brandingItem
  );
}

/** "+2 credits" / "+1 credit" — the add-on hint shown next to an option. */
export function creditsLabel(n: number): string {
  return `+${n} credit${n === 1 ? "" : "s"}`;
}

// Kept for older imports.
export const PREMIUM = PRICE_TABLE.premium;
export const ULTRA = PRICE_TABLE.ultra;
export const MOBILE_EXTRA = PRICE_TABLE.mobileExtra;

function rangeFor(agent: PricedAgent, o: Omit<ImageOptions, "brandingItems">): CreditRange {
  const floor = perImageCredits({ ...o, brandingItems: 0 });
  return { floor, ceiling: floor + BRANDING_ITEMS[agent].length * PRICE_TABLE.brandingItem };
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const has = (v: unknown) => str(v).length > 0;

/** Clamp the browser's number into the server-computed range. */
export function clampCredits(clientValue: unknown, range: CreditRange): number {
  const n = Math.floor(Number(clientValue));
  if (!Number.isFinite(n)) return range.floor;
  return Math.min(Math.max(n, range.floor), range.ceiling);
}

/** Multiply a per-image range by the number of images in a bulk job. */
export function scaleRange(range: CreditRange, count: number): CreditRange {
  const n = Math.max(1, Math.floor(count));
  return { floor: range.floor * n, ceiling: range.ceiling * n };
}

// ── Jewellery ───────────────────────────────────────────────
export function jewelleryCreditRange(body: Bag): CreditRange {
  const shared = (body?.shared_settings && typeof body.shared_settings === "object"
    ? body.shared_settings
    : {}) as Bag;
  const quality = str(shared.output_quality ?? body?.output_quality);
  const size = str(shared.output_size ?? body?.output_size).toLowerCase();

  return rangeFor("jewellery", {
    ultra: quality.toLowerCase() === "ultra hd",
    mobile: size.includes("1080x1920") || size.includes("mobile"),
    ownModel: has(shared.model_photo_url ?? body?.model_photo_url),
    ownScene:
      shared.has_uploaded_scene === true ||
      has(shared.reference_scene_url ?? body?.reference_scene_url),
  });
}

// ── Productography ──────────────────────────────────────────
// "Mobile" here also covers the landscape 1920x1080 frame.
export function productographyCreditRange(body: Bag): CreditRange {
  const quality = str(body?.quality ?? body?.output_quality).toLowerCase();
  const size = str(body?.output_size);

  return rangeFor("productography", {
    ultra: quality.includes("ultra"),
    mobile: size === "1080x1920" || size === "1920x1080",
    ownScene: has(body?.reference_scene_url),
    ownModel: has(body?.model_photo_url),
  });
}

// ── Textile ─────────────────────────────────────────────────
// The route charges this amount itself (personal balance or team
// pool) and tells n8n to skip its own deduction.
export function textileCreditRange(body: Bag): CreditRange {
  const quality = str(body?.quality).toLowerCase();
  const size = str(body?.output_size).toLowerCase();

  return rangeFor("textile", {
    ultra: quality === "ultra hd",
    mobile: size === "1080x1920",
    ownScene: has(body?.reference_scene_url),
    ownModel: has(body?.model_photo_url),
  });
}
