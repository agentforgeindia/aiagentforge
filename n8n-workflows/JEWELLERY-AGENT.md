# AgentForge — Jewellery AI Agent (n8n)

Image-generation backend for [/jewellery-ai](../app/jewellery-ai/page.tsx).
Uses **FAL Nano Banana Edit** (`fal-ai/nano-banana/edit` — Gemini 2.5 Flash Image hosted on FAL) for image-to-image jewellery restyling. Synchronous endpoint — single HTTP call, no polling.

---

## 1. What the agent does

Receives a webhook from `app/api/jewellery/generate/route.ts`, takes the uploaded jewellery photo as a **reference**, restyles the scene (model, pose, props, lighting, shoot style) per the user's selections, and returns a single premium catalogue/editorial visual.

The agent **preserves** the original jewellery exactly (shape, stones, metal tone, polish) and only restyles the scene around it.

### Pipeline (single + bulk in one workflow)

```
Webhook (POST /generate-jewellery)
  ↓
Normalize + Build Per-Item Prompts  (Code — emits N items, 1 per image)
  ↓
Split In Batches (size=1)  ◄────────────────────────────────────┐
  ↓ (loop branch)                                                │
FAL · Nano Banana Edit (sync)                                    │
  POST https://fal.run/fal-ai/nano-banana/edit                   │
  body: { prompt, image_urls:[source_url], num_images:1 }        │
  headers: Authorization: Key <FAL_KEY>                          │
  ↓                                                              │
Extract FAL Result  (Code — reads images[0].url, flags ok/fail)  │
  ↓                                                              │
IF · success?                                                    │
  ├─ true  → Download FAL image → Upload Supabase                │
  │            → Build URL → Update DB (completed)               │
  └─ false → Mark Failed (status=failed, error msg)              │
  ↓                                                              │
Collect Result  (push to workflow static data)                   │
  └────────────────────────────────── back into Split ───────────┘
  ↓ (after all items processed — done branch)
Build Response Body  (Code — reads static data, builds final JSON)
  ↓
Respond to Webhook  ({{ $json }})
{
  success, mode, batch_id, total, completed, failed,
  generation_id, image_url, output_url,    // single-mode convenience
  results: [{ generation_id, status, output_url, error_message, original_name }]
}
```

**No base64 step** — FAL takes the Supabase public image URL directly. Source image is never downloaded by n8n; only the FAL output is downloaded (to re-host on Supabase for permanent storage).

**Single mode** — N=1, loop runs once, response includes `image_url` so the frontend can render immediately.

**Bulk mode** — N=many, loop runs N times sequentially (safer than parallel — Gemini rate-limited + Supabase writes ordered). The frontend's polling loop (line 1487+) picks up each row as it flips to `completed`.

Error path per item: any failure inside the loop hits **Mark Failed** (status=failed, error message). Loop continues with remaining items — one bad image doesn't kill the batch. The frontend stops polling that specific `generation_id` and refunds credits for it.

---

## 2. Setup (n8n side)

### 2.1 Import workflow

In n8n: **Workflows → Import from File → jewellery-agent.json**

### 2.2 Required environment variables

Add these in **n8n Settings → Environment Variables** (or container env):

| Variable | Source | Purpose |
| --- | --- | --- |
| `FAL_KEY` | https://fal.ai/dashboard/keys | FAL Nano Banana image generation (passed as `Authorization: Key <FAL_KEY>`) |
| `SUPABASE_URL` | Supabase project settings → API | e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → service_role key | DB writes + storage uploads (server-side only — never expose) |

> The Next.js vision-guidance API (`/api/jewellery/analyze`) still uses Google Gemini directly — that needs `GOOGLE_GEMINI_API_KEY` in your Next.js `.env.local` (separate from n8n). It's a small text-only call for auto-fill suggestions, not image generation.

> ⚠ **Never** put the service-role key in the Next.js client bundle. It's server-only.

### 2.3 Activate workflow + register webhook

After import, activate the workflow. The webhook URL becomes:

```
https://<your-n8n-host>/webhook/generate-jewellery
```

Match this with these Next.js env vars in `.env.local`:

```
NEXT_PUBLIC_N8N_JEWELLERY_WEBHOOK_URL=https://<your-n8n-host>/webhook/generate-jewellery
N8N_JEWELLERY_WEBHOOK_URL=https://<your-n8n-host>/webhook/generate-jewellery
```

(Already present in your project, just confirm the host.)

---

## 3. The Master Prompt (what gets sent to Nano Banana)

Built dynamically in the **Build Master Prompt** code node from `shared_settings`.

### Hard Rules (non-negotiable)

1. **Preserve the jewellery exactly** — shape, stone count, stone color, stone cut, metal tone, engravings, polish texture. Style the *scene*, not the piece.
2. **NO TEXT, NO SKU, NO PRODUCT CODE, NO BARCODE, NO NUMBERS, NO PRICE, NO LABELS** — anywhere on or near the jewellery. Image must be 100% free of typography.
3. **NO LOGOS baked in** — AgentForge / brand watermarks are overlaid client-side after generation. Output must be a clean photograph only.
4. **Reserve bottom 14%** as a calm, blurred, neutral surface *if* the user has any branding text toggle enabled (`company_name`, `website`, `phone`, `address`). This is where the client-side Canvas overlay draws the branding strip.
5. **Keep top-right corner visually calm** — that's where the logo badge goes (AgentForge for free users, client logo for paid users).
6. **Single photograph only** — no collages, no split frames.

### Style Mapping Tables (in the code node)

The prompt builder converts the user's dropdown picks into rich photographic instructions:

| Setting | Example value | Translated to AI prompt |
| --- | --- | --- |
| `shoot_style` | Bridal Editorial | "rich warm gold tones, ornate silk drape backdrop, candlelight + softbox mix, Vogue Bridal magazine feel" |
| `model_type` | Bridal Model | "Indian bride in full bridal styling — dupatta, traditional outfit, bridal makeup, regal pose" |
| `accessories` | Velvet Box | "jewellery resting on or beside an open black/maroon velvet box — luxury showroom feel" |
| `camera_angle` | Top Down | "directly overhead flat-lay perspective" |
| `face_expression` | Royal | "regal bridal expression, chin slightly raised" |

Full tables live in `n8n-workflows/jewellery-agent.json` → **Build Master Prompt** node. Edit them in n8n to tune output without touching app code.

### Client notes injected verbatim

- `jewellery_notes` — protection notes ("don't change the stone colors, this is a kundan polki")
- `model_notes` — model styling notes
- `custom_instruction` — power-user free-text prompt addition

---

## 4. Branding logic (free vs paid)

The image generation step is **logo-free**. All branding is applied client-side via Canvas in [jewellery-ai/page.tsx → `applyLogoOverlay`](../app/jewellery-ai/page.tsx) once the n8n response arrives:

| Account | Top-right logo | Bottom branding strip |
| --- | --- | --- |
| **Free** | AgentForge logo (`/af-logo.png`) | Hidden unless user fills + toggles ON details |
| **Paid** | Client's uploaded logo (from `companyLogoPreview`) | Hidden unless user toggles ON name/website/phone/address |

The n8n agent receives `af_watermark: true|false` (flag for free plan) and `company_details: { logo_url, company_name, website, phone, address }`. It uses these **only** to decide whether to reserve clean bottom canvas space — it does **not** render logos or text itself.

---

## 5. Payload spec (what the webhook receives)

```jsonc
{
  "generation_mode": "single" | "bulk",
  "generation_id": "uuid",
  "user_id": "uuid",
  "required_credits": 15,
  "source_image_url": "https://...supabase.co/.../jewellery-products/...png",
  "batch_id": "jewellery-1740000000000" | null,
  "items": [
    {
      "generation_id": "uuid",
      "source_image_url": "https://...",
      "original_name": "ring-1.jpg"
    }
  ],
  "shared_settings": {
    "jewellery_type": "Necklace",
    "more_jewellery": [],
    "shoot_style": "Bridal Editorial",
    "model_type": "Bridal Model",
    "pose": "Neck Close-up",
    "face_expression": "Royal",
    "accessories": "Velvet Box",
    "camera_angle": "45° Angle",
    "output_size": "Square 1080x1080",
    "output_quality": "Premium",
    "jewellery_notes": "Polki + uncut diamonds, do not change stone color",
    "model_notes": "Bride looking down at the necklace",
    "custom_instruction": "Warm candlelight feel",
    "af_watermark": true,            // true = free account
    "company_details": {
      "logo_url": "",                // empty if free
      "company_name": "Sharma Jewellers",
      "website": "sharmajewels.in",
      "phone": "+91 98xxxxxxxx",
      "address": ""                  // empty if toggle off
    }
  }
}
```

> Note: SKU is **never** in the payload — and even if some other system ever adds it, the master prompt's Hard Rule #2 forbids text on the image.

---

## 6. Response spec (what n8n returns)

```json
{
  "success": true,
  "generation_id": "uuid",
  "image_url": "https://...supabase.co/storage/v1/object/public/designs/jewellery-outputs/<user>/<ts>-<id>.png",
  "output_url": "https://..."
}
```

The frontend reads `image_url` (or any of `output_url`, `data.url`, `data.result.image_url`) — see `handleGenerate` in [jewellery-ai/page.tsx](../app/jewellery-ai/page.tsx).

---

## 7. Tuning checklist (when output looks off)

| Symptom | Fix in n8n |
| --- | --- |
| Stone colors changed | Add stronger preservation language in Hard Rule #1 + ensure `jewellery_notes` is rendered prominently |
| Metal tone shifted (gold → rose gold) | Add `"metal tone must be identical pixel-color match"` to Rule #1 |
| Random text / SKU appearing | Reinforce Rule #2; add `"if you are about to draw a number, code, label or any text — stop and produce a clean surface instead"` |
| Bottom strip getting cluttered | Push reserve % higher (14 → 18) in `reserveBottomStrip` block |
| Model looks too Western | Strengthen `Indian Model` guide entry — add "South Asian", "Indian heritage features", "warm undertone" |
| Bulk too slow / rate-limit hits | Increase `batchSize` from 1 → 3 on **Split In Batches** (parallel — only if your FAL quota allows). Also bump the FAL HTTP node timeout. |
| Bulk needs different style per item | Move `shared_settings` lookup inside **Normalize** node to be per-item (read from `item.settings` instead of `body.shared_settings`). Frontend doesn't send per-item settings today, but the agent is ready. |
| FAL sync times out (>60s job) | Switch to **queue endpoint** (`https://queue.fal.run/fal-ai/nano-banana/edit`) — submit returns `request_id` + `status_url` + `response_url`. Add a Wait (5s) + Status Check loop until `status==='COMPLETED'`, then GET `response_url`. Same body shape, same auth header. |
| FAL returns 401 / 403 | Verify `FAL_KEY` env var in n8n. Header must be exactly `Authorization: Key <key>` (the word "Key" not "Bearer"). |

---

## 8. Companion: Vision Guidance API

Live at `app/api/jewellery/analyze/route.ts` (Next.js side, not n8n).
On upload, the frontend calls it with the uploaded image URL. Gemini Vision analyzes the jewellery and returns recommended Step 1–3 picks, which auto-fill the form and show a small "AI suggests" card with the reason.

This is a separate, lightweight call (no image generation) so it's fast (<2s) and cheap. The full Nano Banana edit only runs on **Generate**.
