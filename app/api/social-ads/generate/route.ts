// ============================================================
// /api/social-ads/generate — Social Media Ads Designer
// ============================================================
// Generates platform-ready ads for any business category in 12
// languages. Supports single + bulk modes.
//
// Built on the secure factory — auth, URL allowlist, atomic
// credit deduction, generations row insert, and auto-refund
// on failure are all handled there.
//
// Pipeline (downstream of this route):
//   1. n8n receives the payload
//   2. For each item × each variation, n8n calls OpenAI
//      gpt-image-1 to produce a TEXT-FREE background composition
//   3. n8n calls /api/social-ads/composite to overlay logo +
//      text using bundled Noto fonts (100% accurate Indic text)
//   4. n8n PATCHes generations.status='completed'
// ============================================================

import {
  createSecureGenerateRoute,
  isUuidish,
  type GenerationRow,
} from "@/lib/createSecureGenerateRoute";

export const runtime = "nodejs";

// ────────────────────────────────────────────────────────────
// Allowed enums — keep in sync with frontend dropdowns and the
// n8n prompt switch + lib/socialAdsComposer.ts.
// ────────────────────────────────────────────────────────────

const ALLOWED_CATEGORIES = [
  "doctor",
  "hospital-clinic",
  "restaurant-food",
  "real-estate",
  "gift-shop",
  "hotel",
  "jewellery",
  "fashion-boutique",
  "industrial-steel",
  "education-coaching",
  "salon-spa",
  "automobile-servicing",
  "gym-fitness",
  "wedding-planner",
  "travel-tours",
  "pooja-store",
  "general-business",
] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];

const ALLOWED_PLATFORMS = [
  "instagram-post",
  "instagram-story",
  "facebook-post",
  "linkedin-post",
  "youtube-thumbnail",
  "whatsapp-status",
  "newspaper-ad",
] as const;
type Platform = (typeof ALLOWED_PLATFORMS)[number];

const ALLOWED_LANGUAGES = [
  "english",
  "hindi",
  "hinglish",
  "marathi",
  "tamil",
  "telugu",
  "gujarati",
  "punjabi",
  "bengali",
  "urdu",
  "kannada",
  "malayalam",
] as const;
type Language = (typeof ALLOWED_LANGUAGES)[number];

const ALLOWED_STYLES = [
  "modern",
  "luxury",
  "festive",
  "minimal",
  "bold-industrial",
  "traditional",
] as const;
type StyleTheme = (typeof ALLOWED_STYLES)[number];

// ────────────────────────────────────────────────────────────
// Body shapes
// ────────────────────────────────────────────────────────────

type ContactInfo = {
  phone?: string;
  website?: string;
  address?: string;
  email?: string;
};

type AdSpec = {
  generation_id: string;

  business_category: Category;
  business_name: string;
  main_headline: string;
  tagline?: string | null;
  offer_text?: string | null;
  contact_info?: ContactInfo | null;

  logo_url?: string | null;
  hero_image_url?: string | null;
  extra_image_urls?: string[] | null;

  language: Language;
  platform: Platform;
  style_theme: StyleTheme;
  color_palette?: string | null;
  variations: number;             // 1..MAX_VARIATIONS_PER_ITEM
  custom_instruction?: string | null;
};

type SingleBody = AdSpec & {
  generation_mode: "single";
  required_credits: number;
};

type BulkBody = {
  generation_mode: "bulk";
  batch_id: string;
  required_credits: number;       // server still caps via maxCreditsPerCall
  items: AdSpec[];
};

type Body = SingleBody | BulkBody;

// ────────────────────────────────────────────────────────────
// Caps
// ────────────────────────────────────────────────────────────

const MAX_HEADLINE_LEN = 120;
const MAX_TAGLINE_LEN = 160;
const MAX_EXTRA_IMAGES = 4;
const MAX_VARIATIONS_PER_ITEM = 4;
const MAX_BULK_ITEMS = 50;
// Hard ceiling: 50 items × 4 vars × 12 credits = 2400 — well above
// any reasonable single call. The factory's maxCreditsPerCall is
// the actual ceiling.
const MAX_CREDITS_PER_CALL = 2500;

// ────────────────────────────────────────────────────────────
// Per-item shape check (used for single + each bulk item)
// ────────────────────────────────────────────────────────────

function asStr(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function validateAdSpec(b: any, label: string): { ok: true; spec: AdSpec } | { ok: false; error: string } {
  if (!b || typeof b !== "object") {
    return { ok: false, error: `${label}: must be object.` };
  }
  if (!isUuidish(b.generation_id)) {
    return { ok: false, error: `${label}: generation_id missing / not a UUID.` };
  }
  if (!ALLOWED_CATEGORIES.includes(b.business_category)) {
    return { ok: false, error: `${label}: business_category not supported.` };
  }
  if (!ALLOWED_PLATFORMS.includes(b.platform)) {
    return { ok: false, error: `${label}: platform not supported.` };
  }
  if (!ALLOWED_LANGUAGES.includes(b.language)) {
    return { ok: false, error: `${label}: language not supported.` };
  }
  if (!ALLOWED_STYLES.includes(b.style_theme)) {
    return { ok: false, error: `${label}: style_theme not supported.` };
  }
  const businessName = asStr(b.business_name, 100);
  if (!businessName) {
    return { ok: false, error: `${label}: business_name required (≤ 100 chars).` };
  }
  const headline = asStr(b.main_headline, MAX_HEADLINE_LEN);
  if (!headline) {
    return { ok: false, error: `${label}: main_headline required (≤ ${MAX_HEADLINE_LEN}).` };
  }
  const variations = Number(b.variations);
  if (!Number.isInteger(variations) || variations < 1 || variations > MAX_VARIATIONS_PER_ITEM) {
    return {
      ok: false,
      error: `${label}: variations must be 1..${MAX_VARIATIONS_PER_ITEM}.`,
    };
  }
  const extras = b.extra_image_urls;
  if (extras != null) {
    if (!Array.isArray(extras) || extras.length > MAX_EXTRA_IMAGES) {
      return {
        ok: false,
        error: `${label}: extra_image_urls must be array of ≤ ${MAX_EXTRA_IMAGES}.`,
      };
    }
    if (extras.some((u: unknown) => typeof u !== "string")) {
      return { ok: false, error: `${label}: extra_image_urls must be strings.` };
    }
  }
  const contact = b.contact_info ?? null;
  if (contact != null && typeof contact !== "object") {
    return { ok: false, error: `${label}: contact_info must be object.` };
  }

  return {
    ok: true,
    spec: {
      generation_id: b.generation_id,
      business_category: b.business_category,
      business_name: businessName,
      main_headline: headline,
      tagline: asStr(b.tagline, MAX_TAGLINE_LEN),
      offer_text: asStr(b.offer_text, 60),
      contact_info: contact,
      logo_url: typeof b.logo_url === "string" ? b.logo_url : null,
      hero_image_url: typeof b.hero_image_url === "string" ? b.hero_image_url : null,
      extra_image_urls: Array.isArray(extras) ? (extras as string[]) : null,
      language: b.language,
      platform: b.platform,
      style_theme: b.style_theme,
      color_palette: asStr(b.color_palette, 80),
      variations,
      custom_instruction: asStr(b.custom_instruction, 500),
    },
  };
}

// ────────────────────────────────────────────────────────────

export const POST = createSecureGenerateRoute<Body>({
  agentSlug: "social-ads",
  reasonLabel: "social_ads_generate",
  webhookEnvVars: ["N8N_SOCIAL_ADS_WEBHOOK_URL"],
  creditMode: "server",
  maxCreditsPerCall: MAX_CREDITS_PER_CALL,
  maxBulkItems: MAX_BULK_ITEMS,

  validateBody: (raw) => {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "Body must be JSON." };
    }
    const b = raw as Record<string, unknown>;
    const mode = b.generation_mode;

    if (mode === "single") {
      const v = validateAdSpec(b, "body");
      if (!v.ok) return v;
      return {
        ok: true,
        body: {
          ...v.spec,
          generation_mode: "single",
          required_credits: Number(b.required_credits),
        },
      };
    }

    if (mode === "bulk") {
      const batchId = b.batch_id;
      if (!isUuidish(batchId)) {
        return { ok: false, error: "batch_id missing / not a UUID." };
      }
      if (!Array.isArray(b.items) || b.items.length === 0) {
        return { ok: false, error: "items must be a non-empty array." };
      }
      if (b.items.length > MAX_BULK_ITEMS) {
        return { ok: false, error: `bulk capped at ${MAX_BULK_ITEMS} items.` };
      }
      const specs: AdSpec[] = [];
      for (let i = 0; i < b.items.length; i++) {
        const v = validateAdSpec(b.items[i], `items[${i}]`);
        if (!v.ok) return v;
        specs.push(v.spec);
      }
      // generation_ids must be unique inside one batch
      const idSet = new Set(specs.map((s) => s.generation_id));
      if (idSet.size !== specs.length) {
        return { ok: false, error: "items must have unique generation_ids." };
      }
      return {
        ok: true,
        body: {
          generation_mode: "bulk",
          batch_id: batchId as string,
          required_credits: Number(b.required_credits),
          items: specs,
        },
      };
    }

    return { ok: false, error: "generation_mode must be 'single' or 'bulk'." };
  },

  collectUrls: (body) => {
    const items = body.generation_mode === "single" ? [body] : body.items;
    const urls: string[] = [];
    for (const it of items) {
      if (it.logo_url) urls.push(it.logo_url);
      if (it.hero_image_url) urls.push(it.hero_image_url);
      if (it.extra_image_urls) urls.push(...it.extra_image_urls);
    }
    return urls.filter(Boolean);
  },

  buildGenerationRows: (body, userId): GenerationRow[] => {
    const items = body.generation_mode === "single" ? [body] : body.items;
    const batchId = body.generation_mode === "bulk" ? body.batch_id : null;
    return items.map((it) => ({
      id: it.generation_id,
      user_id: userId,
      status: "pending",
      agent_type: "social-ads",
      category: it.business_category,
      design_url: it.hero_image_url ?? it.logo_url ?? null,
      input_image_url: it.hero_image_url ?? it.logo_url ?? null,
      custom_instruction: it.custom_instruction ?? null,
      batch_id: batchId,
    }));
  },

  buildForwardPayload: (body) => {
    // n8n receives a uniform shape regardless of mode.
    if (body.generation_mode === "single") {
      return {
        generation_mode: "single",
        required_credits: body.required_credits,
        agent_type: "social-ads",
        items: [adSpecToWire(body)],
      };
    }
    return {
      generation_mode: "bulk",
      batch_id: body.batch_id,
      required_credits: body.required_credits,
      agent_type: "social-ads",
      items: body.items.map(adSpecToWire),
    };
  },

  pickAuditId: (body) =>
    body.generation_mode === "single" ? body.generation_id : body.batch_id,

  extraResponseFields: (body) => {
    if (body.generation_mode === "bulk") {
      return {
        mode: "bulk",
        batch_id: body.batch_id,
        generation_ids: body.items.map((i) => i.generation_id),
      };
    }
    return { mode: "single" };
  },
});

// ────────────────────────────────────────────────────────────
// Wire shape sent to n8n — flat, predictable, no nullables
// hidden inside other fields.
// ────────────────────────────────────────────────────────────
function adSpecToWire(spec: AdSpec) {
  return {
    generation_id: spec.generation_id,
    business_category: spec.business_category,
    business_name: spec.business_name,
    main_headline: spec.main_headline,
    tagline: spec.tagline,
    offer_text: spec.offer_text,
    contact_info: spec.contact_info,
    logo_url: spec.logo_url,
    hero_image_url: spec.hero_image_url,
    extra_image_urls: spec.extra_image_urls ?? [],
    language: spec.language,
    platform: spec.platform,
    style_theme: spec.style_theme,
    color_palette: spec.color_palette,
    variations: spec.variations,
    custom_instruction: spec.custom_instruction,
  };
}
