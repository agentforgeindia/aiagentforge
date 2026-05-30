# Social Media Ads Designer — Agent (PRO)

Generates platform-ready social media ads for 17 business categories
(doctor, hospital, restaurant, real estate, gift shop, hotel,
jewellery, fashion, industrial, education, salon, **automobile
servicing**, gym, wedding planner, travel, pooja store, general
business) in 12 languages, with a two-stage pipeline:

- **Stage 1** — `gpt-image-1` (via FAL's BYOK proxy) produces the
  BACKGROUND composition only (hero image, palette, mood, with
  text zones reserved empty). AI does what it's great at: visual
  composition. FAL chosen so the agent shares the same provider /
  billing infra as the jewellery + textile agents.
- **Stage 2** — `lib/socialAdsComposer.ts` overlays the brand
  logo and all business-critical text (headline, tagline, offer,
  contact) using bundled Noto fonts (Devanagari, Tamil, Telugu,
  Gujarati, Gurmukhi, Bengali, Kannada, Malayalam, Nastaliq Urdu,
  Poppins Latin). Zero spelling errors, every language.

This is what you get vs. running gpt-image-1 end-to-end: brand
name "Speedy Auto Care" never becomes "Speedi Auto Caer", phone
"+91 90000 00000" never becomes "+91 90OOO O0OOO", and ਪੰਜਾਬੀ
letters never lose their bindi.

## Files

| File | Purpose |
|---|---|
| [`app/api/social-ads/generate/route.ts`](../app/api/social-ads/generate/route.ts) | User-facing route via secure factory — auth, URL allowlist, atomic credit deduction, generations row insert (per item for bulk), n8n forward, refund on failure |
| [`app/api/social-ads/composite/route.ts`](../app/api/social-ads/composite/route.ts) | INTERNAL route called by n8n — shared-secret auth, runs the composer, uploads final PNG to Supabase |
| [`lib/socialAdsComposer.ts`](../lib/socialAdsComposer.ts) | The overlay engine — platform templates (zones per platform), per-language font registry, SVG text rendering, sharp compositing |
| [`app/social-ads/page.tsx`](../app/social-ads/page.tsx) | Frontend — single + bulk modes, CSV import, polling, gallery |
| [`n8n-workflows/social-ads-agent.json`](./social-ads-agent.json) | n8n workflow — fan out per (item × variation), FAL gpt-image-1 call (BYOK), composite call, generations PATCH |

## Install

The composer needs native deps. After pulling:

```bash
npm install
# This installs:
#   - sharp                              (image composition)
#   - @fontsource/poppins                (Latin)
#   - @fontsource/noto-sans-devanagari   (Hindi, Marathi)
#   - @fontsource/noto-sans-tamil        (Tamil)
#   - @fontsource/noto-sans-telugu       (Telugu)
#   - @fontsource/noto-sans-gujarati     (Gujarati)
#   - @fontsource/noto-sans-gurmukhi     (Punjabi)
#   - @fontsource/noto-sans-bengali      (Bengali)
#   - @fontsource/noto-sans-kannada      (Kannada)
#   - @fontsource/noto-sans-malayalam    (Malayalam)
#   - @fontsource/noto-nastaliq-urdu     (Urdu)
```

On Vercel / Linux deploys, `sharp` ships its own libvips binary
— no system package needed. On Windows dev you may see a
post-install build step.

## Env vars

```bash
# Next.js — used by /api/social-ads/generate
N8N_SOCIAL_ADS_WEBHOOK_URL=https://n8n.aiagentforge.in/webhook/generate-social-ads

# Next.js — used by /api/social-ads/composite to auth n8n
INTERNAL_COMPOSITE_SECRET=<random 32+ char string>

# n8n container — used by the workflow
FAL_KEY=<fal-api-key>                 # already configured for jewellery agent
OPENAI_API_KEY=sk-...                 # FAL gpt-image-1 is BYOK — passes through
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt>
INTERNAL_COMPOSITE_SECRET=<same value as above>
APP_URL=https://aiagentforge.in       # base URL of the Next.js deployment
```

### Why FAL + BYOK?

The workflow calls `fal-ai/gpt-image-1/text-to-image/byok` (or
`/edit-image/byok` when a hero is provided). "BYOK" = bring your
own key — FAL proxies the call to OpenAI using your
`OPENAI_API_KEY`, but billing for the FAL gateway stays on your
existing FAL account.

Net result: you get OpenAI's gpt-image-1 quality (great for ads,
better text-zone discipline than Nano Banana) while keeping the
same infrastructure / billing / monitoring pattern the jewellery
+ textile agents already use.

> **Generate the secret with:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
>
> The same value must be set in BOTH the Next.js env and the n8n
> container. The composite route compares them in constant time.

## Credit cost

- `12` credits per variation
- 1–4 variations per ad spec
- Bulk: 1–50 ad specs per call
- Server cap (`maxCreditsPerCall`): **2500** — 50 items × 4 vars × 12 credits ceiling
- `creditMode: "server"` — the Next.js route deducts atomically;
  on **any** failure (DB insert, n8n unreachable, n8n 4xx/5xx)
  the factory auto-refunds. The n8n workflow MUST NOT touch credits.

## Webhook contract — single mode

```json
{
  "user_id": "<JWT-verified UUID>",
  "generation_mode": "single",
  "required_credits": 24,
  "agent_type": "social-ads",
  "items": [
    {
      "generation_id": "<UUID>",
      "business_category": "automobile-servicing",
      "business_name": "Speedy Auto Care",
      "main_headline": "MONSOON CAR SERVICE",
      "tagline": "Free pickup & drop in 30 min",
      "offer_text": "FLAT 25% OFF",
      "contact_info": { "phone": "+91 90000 00000", "website": "speedy.in", "address": "Bangalore" },
      "logo_url": "https://...supabase.co/.../logo.png",
      "hero_image_url": "https://...supabase.co/.../car.jpg",
      "extra_image_urls": [],
      "language": "hindi",
      "platform": "instagram-post",
      "style_theme": "bold-industrial",
      "color_palette": "#0044CC,#FFD700",
      "variations": 2,
      "custom_instruction": null
    }
  ]
}
```

## Webhook contract — bulk mode

```json
{
  "user_id": "<JWT-verified UUID>",
  "generation_mode": "bulk",
  "batch_id": "<UUID>",
  "required_credits": 144,
  "agent_type": "social-ads",
  "items": [ /* up to 50 ad specs, each shaped like the single-mode item */ ]
}
```

The workflow fans out to one image per (item × variation), processes
in `Split In Batches`, then aggregates per `generation_id` so each
generations row gets a single PATCH with all its variations.

## CSV bulk import (frontend)

The page accepts a CSV with this header:

```
business_name,category,headline,tagline,offer,phone,website,address,language,platform,style,colors,variations,custom_instruction
```

Click "Download CSV template" on the page to get a working starter.

Note: logos/hero images cannot be uploaded via CSV — after import,
attach images per-row in the UI (or run text-only ads).

## Adding a new category

1. **API route** — add the slug to `ALLOWED_CATEGORIES` in
   `app/api/social-ads/generate/route.ts`.
2. **Frontend** — add to `CATEGORIES` in `app/social-ads/page.tsx`.
3. **n8n** — add a `CATEGORY_GUIDE` entry in the
   `Fan out: spec × variations` Code node.

All three places, or the prompt switch will fall back to
`general-business`.

## Adding a new platform

1. `ALLOWED_PLATFORMS` (API route)
2. `PLATFORMS` (frontend)
3. `PLATFORM_SIZES` (n8n workflow) — set `fal_size` to the closest
   gpt-image-1 supported value (`1024x1024`, `1024x1536`, `1536x1024`)
4. `PLATFORMS` (`lib/socialAdsComposer.ts`) — add a template with
   per-zone coordinates

## Adding a new language

1. `ALLOWED_LANGUAGES` (API route)
2. `LANGUAGES` (frontend)
3. `FONTS` (`lib/socialAdsComposer.ts`) — pick a Noto font from
   `@fontsource/*` and add it to `package.json`

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `401` from `/api/social-ads/generate` | Missing JWT in `Authorization` header | Send `Bearer ${session.access_token}` |
| `400 URL is not AgentForge-hosted` | Logo/hero/extra URL points outside Supabase | Re-upload via the in-page uploader |
| `402 Not enough credits` | Balance < required | Top up at `/pricing` |
| `403 Forbidden` from composite route | `INTERNAL_COMPOSITE_SECRET` mismatch between n8n and Next.js | Re-paste the same secret in both env files |
| `502 n8n unreachable` | `N8N_SOCIAL_ADS_WEBHOOK_URL` not set, or n8n down | Check env + n8n health. Credits auto-refunded. |
| FAL node returns `Invalid api_key` | `OPENAI_API_KEY` env missing in n8n container (FAL passes it through to OpenAI) | Add it to n8n env — required even though FAL is the gateway |
| FAL node returns `unauthorized` | `FAL_KEY` missing in n8n container | Add it; same key the jewellery agent already uses |
| Final image has empty text zones | Composite route never ran or returned an error | Inspect n8n execution; check `Call /api/social-ads/composite` node response |
| Logo distorted / blurry | Logo source PNG too small (under 200×80) | Provide a larger transparent PNG |
| Headline looks wrong size | Headline > 120 chars after trim | Server clamps; for very long ad copy use the tagline field |
| Garbled Indic glyphs | The relevant `@fontsource/noto-sans-<script>` package missing from node_modules | `npm install` to fetch all font packages |

## Why the two-stage pipeline (vs. all-in-one)

Tried gpt-image-1 alone first; it makes great backgrounds but
randomly fumbles brand-critical text — wrong spelling, wrong
character set, dropped matras on Devanagari/Tamil/Bengali. For
ads that get paid-promoted or printed, this is unacceptable.

Tried FAL Nano Banana — fast and cheap, but worse at text and
weaker on Indic.

Final approach: let the AI focus on visual composition, do text
deterministically with real Unicode fonts. This way:

- Spelling is **always** correct
- Indic scripts render with proper matras, conjuncts, bindis
- Brand colors / logo are preserved pixel-perfect
- Re-runs are reproducible (same input → same output)
- Per-platform layouts are templated, not "hopefully respected"
