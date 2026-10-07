// ============================================================
// Server-side credit pricing for the generate routes
// ============================================================
// The agent pages calculate the credits for a generation in the
// browser and send that number as `required_credits`. Trusting it
// let anyone pay 1 credit for an Ultra HD or bulk job.
//
// These helpers recompute the price on the SERVER from the same
// options the page charges for, and clamp whatever the browser
// sent into the allowed range:
//
//   floor  = quality/size base + uploaded-model + uploaded-scene
//            (everything the server can see in the payload)
//   ceiling = floor + the branding add-ons (+1 each)
//
// Branding (logo / name / phone / website / address) is drawn on a
// canvas in the browser and never reaches the server, so it is the
// only part still declared by the client — bounded to its real
// maximum. An honest browser always lands inside [floor, ceiling],
// so what the user sees on the button is exactly what is charged.
//
// The numbers mirror the page formulas:
//   • app/jewellery-ai/page.tsx        (`credits` useMemo)
//   • app/productography-ai/page.tsx   (`requiredCredits`)
//   • app/textileprints-to-mockup/page.tsx (`getRequiredCredits`)
// If you change a price there, change it here in the same commit.
// ============================================================

export type CreditRange = { floor: number; ceiling: number };

/** A request body — every field is untrusted until checked. */
type Bag = Record<string, unknown>;

const PREMIUM = 15;
const ULTRA = 30;
const MOBILE_EXTRA = 2;
const UPLOADED_MODEL = 2;
const UPLOADED_SCENE = 2;

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
// Ultra HD 30 · Mobile 17 · otherwise 15, +2 own model, +2 own scene,
// +1 per branding item (logo, name, website, phone, address).
export function jewelleryCreditRange(body: Bag): CreditRange {
  const shared = (body?.shared_settings && typeof body.shared_settings === "object"
    ? body.shared_settings
    : {}) as Bag;
  const quality = str(shared.output_quality ?? body?.output_quality);
  const size = str(shared.output_size ?? body?.output_size).toLowerCase();

  let floor = PREMIUM;
  if (quality === "Ultra HD") floor = ULTRA;
  else if (size.includes("1080x1920") || size.includes("mobile")) floor = PREMIUM + MOBILE_EXTRA;

  if (has(shared.model_photo_url ?? body?.model_photo_url)) floor += UPLOADED_MODEL;
  if (
    shared.has_uploaded_scene === true ||
    has(shared.reference_scene_url ?? body?.reference_scene_url)
  ) {
    floor += UPLOADED_SCENE;
  }

  return { floor, ceiling: floor + 5 };
}

// ── Productography ──────────────────────────────────────────
// 15, +15 Ultra, +2 portrait/landscape, +2 own scene, +2 own photo,
// +1 per branding item (logo, name, phone, website, address).
export function productographyCreditRange(body: Bag): CreditRange {
  const quality = str(body?.quality ?? body?.output_quality).toLowerCase();
  const size = str(body?.output_size);

  let floor = PREMIUM;
  if (quality.includes("ultra")) floor += ULTRA - PREMIUM;
  if (size === "1080x1920" || size === "1920x1080") floor += MOBILE_EXTRA;
  if (has(body?.reference_scene_url)) floor += UPLOADED_SCENE;
  if (has(body?.model_photo_url)) floor += UPLOADED_MODEL;

  return { floor, ceiling: floor + 5 };
}

// ── Textile ─────────────────────────────────────────────────
// Used when the SERVER charges (team pool). Personal textile
// generations are still charged inside the n8n workflow.
// Ultra HD 30 · otherwise 15, +2 mobile, +2 own scene, +2 own model,
// +1 per branding text item (name, phone, website, address).
export function textileCreditRange(body: Bag): CreditRange {
  const quality = str(body?.quality).toLowerCase();
  const size = str(body?.output_size).toLowerCase();

  let floor = quality === "ultra hd" ? ULTRA : PREMIUM;
  if (size === "1080x1920") floor += MOBILE_EXTRA;
  if (has(body?.reference_scene_url)) floor += UPLOADED_SCENE;
  if (has(body?.model_photo_url)) floor += UPLOADED_MODEL;

  return { floor, ceiling: floor + 4 };
}
