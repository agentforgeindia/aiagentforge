// ============================================================
// AgentForge — Scene Editor (server-side helpers)
// ============================================================
// Powers /scene-editor: upload or pick a room scene, AUTO-DETECT the
// changeable décor (lamp, curtains, wall art, plants, lighting …),
// then EDIT one element at a time while the main product (bedspread /
// quilt) stays untouched. Also supports placing the user's OWN
// product image into the scene.
//
// Provider-switchable (cheapest wins):
//   SCENE_IMAGE_PROVIDER = "gemini" | "openai"
//     • gemini → Nano Banana (gemini-2.5-flash-image) ~₹3–4 / image.
//     • openai → gpt-image-1 (medium) ~₹5 / image.
//   If SCENE_IMAGE_PROVIDER is unset, we auto-pick gemini when
//   GEMINI_API_KEY exists, else fall back to openai.
//
// Server-only — never import from a client component.
// ============================================================

import { isAgentForgeHostedUrl } from "@/lib/uploadValidation";

// ── Credit costs (single source of truth) ────────────────────
export const SCENE_CREDIT_COST = {
  sample: 1, // "Use your scene"
  upload: 1, // "Upload your image" / bring a scene in
  inline: 1, // analyze inside the mockup flow
  change: 5, // each equipment / element change
} as const;

export type SceneSource = "sample" | "upload" | "inline";
export type DetectedElement = { id: string; name: string; options: string[] };

// OpenAI models.
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
const OPENAI_IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY?.trim() || "medium";

// Gemini (Nano Banana) models.
const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";

// Keep edits surgical: the product must never change.
const PRESERVE_RULE =
  "CRITICAL — this is a LOCALIZED edit, not a re-generation. Change ONLY the one item asked for. Keep every other pixel identical: the bedspread / quilt and its EXACT printed fabric pattern (colours, motifs, borders), the pillows and cushion covers and their prints, the bed, headboard, framing, camera angle, perspective, depth and lighting must stay byte-for-byte the same. Do NOT redraw, restyle, recolour or regenerate the bedding, pillows or the rest of the room. The result must look like the original photo with only that single element swapped.";

const DETECT_INSTRUCTION =
  "You are an interior-design assistant. Look at the room photo and list the décor / furnishing elements a user could realistically swap or restyle — for example: table lamp, curtains, wall art / photo frames, indoor plant, rug, wall colour, bedside table, and lamp lighting (on/off). " +
  "DO NOT list the bed, the bedspread, the quilt or its printed fabric pattern — that is the fixed product and must never be changed. " +
  "Return STRICT JSON only: " +
  '{"elements":[{"id":"kebab-case-id","name":"Short label","options":["3 to 5 realistic swap options"]}]}. ' +
  "Give at most 8 elements. For any lamp/light include an option like \"Turn the lamp on (warm glow)\" and \"Turn the lamp off\".";

// ── Provider selection ───────────────────────────────────────
function activeProvider(): "openai" | "gemini" {
  const p = (process.env.SCENE_IMAGE_PROVIDER || "").toLowerCase();
  if (p === "gemini") return "gemini";
  if (p === "openai") return "openai";
  return process.env.GEMINI_API_KEY?.trim() ? "gemini" : "openai";
}

// ── Shared helpers ───────────────────────────────────────────
function normalizeElements(parsed: any): DetectedElement[] {
  if (!Array.isArray(parsed?.elements)) return [];
  return parsed.elements
    .filter((e: any) => e && e.name && Array.isArray(e.options))
    .slice(0, 8)
    .map((e: any, i: number) => ({
      id: String(e.id || `el-${i}`).slice(0, 40),
      name: String(e.name).slice(0, 60),
      options: e.options
        .filter((o: any) => typeof o === "string")
        .slice(0, 5)
        .map((o: string) => o.slice(0, 80)),
    }));
}

// Resolve a source image to raw bytes. Accepts a hosted URL (first
// edit) or a base64 / data-URL (chained edits — the model's own
// previous output, so no SSRF surface).
async function resolveImageBytes(
  imageUrl: string | undefined,
  imageB64: string | undefined,
): Promise<{ ok: true; bytes: Uint8Array; mime: string } | { ok: false; error: string }> {
  if (imageB64) {
    const m = /^data:(image\/[a-z+]+);base64,(.*)$/i.exec(imageB64.trim());
    const mime = m ? m[1] : "image/png";
    const b64 = m ? m[2] : imageB64.trim();
    try {
      const bytes = Uint8Array.from(Buffer.from(b64, "base64"));
      if (bytes.length === 0) return { ok: false, error: "Empty image data." };
      if (bytes.length > 12 * 1024 * 1024) return { ok: false, error: "Image too large." };
      return { ok: true, bytes, mime };
    } catch {
      return { ok: false, error: "Invalid base64 image." };
    }
  }
  if (imageUrl) {
    if (!isAgentForgeHostedUrl(imageUrl))
      return { ok: false, error: "Image URL is not AgentForge-hosted." };
    try {
      const r = await fetch(imageUrl, { cache: "no-store" });
      if (!r.ok) return { ok: false, error: `Could not fetch image (${r.status}).` };
      const mime = r.headers.get("content-type") || "image/png";
      const buf = new Uint8Array(await r.arrayBuffer());
      if (buf.length === 0) return { ok: false, error: "Fetched image is empty." };
      return { ok: true, bytes: buf, mime };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Image fetch failed." };
    }
  }
  return { ok: false, error: "No image provided." };
}

function toB64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function extFor(mime: string): string {
  return mime.includes("jpeg") || mime.includes("jpg")
    ? "jpg"
    : mime.includes("webp")
      ? "webp"
      : "png";
}

export type EditArgs = {
  imageUrl?: string;
  imageB64?: string;
  instruction: string;
  referenceUrl?: string;
  referenceB64?: string;
};

type DetectResult = { ok: true; elements: DetectedElement[] } | { ok: false; error: string };
type EditResult = { ok: true; b64: string } | { ok: false; error: string };

// ════════════════════════════════════════════════════════════
// Public dispatchers
// ════════════════════════════════════════════════════════════
export async function detectElements(imageUrl: string): Promise<DetectResult> {
  return activeProvider() === "gemini"
    ? detectElementsGemini(imageUrl)
    : detectElementsOpenai(imageUrl);
}

export async function editScene(args: EditArgs): Promise<EditResult> {
  return activeProvider() === "gemini" ? editSceneGemini(args) : editSceneOpenai(args);
}

// ════════════════════════════════════════════════════════════
// Gemini (Nano Banana) — cheapest
// ════════════════════════════════════════════════════════════
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function detectElementsGemini(imageUrl: string): Promise<DetectResult> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return { ok: false, error: "GEMINI_API_KEY is not configured." };

  const img = await resolveImageBytes(imageUrl, undefined);
  if (!img.ok) return img;

  try {
    const res = await fetch(`${GEMINI_BASE}/${GEMINI_VISION_MODEL}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${DETECT_INSTRUCTION}\n\nDetect the changeable décor elements in this room.` },
              { inline_data: { mime_type: img.mime, data: toB64(img.bytes) } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      }),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json?.error?.message || `Gemini HTTP ${res.status}` };

    const raw = (json?.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p?.text)
      .filter(Boolean)
      .join("")
      .trim();
    if (!raw) return { ok: false, error: "Empty detection response." };

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Could not parse detection JSON." };
    }
    const elements = normalizeElements(parsed);
    if (elements.length === 0) return { ok: false, error: "No editable elements detected." };
    return { ok: true, elements };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Detection request failed." };
  }
}

async function editSceneGemini(args: EditArgs): Promise<EditResult> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return { ok: false, error: "GEMINI_API_KEY is not configured." };

  const instruction = (args.instruction || "").trim();
  if (!instruction) return { ok: false, error: "No change instruction provided." };

  const src = await resolveImageBytes(args.imageUrl, args.imageB64);
  if (!src.ok) return src;

  const parts: any[] = [
    { text: `${instruction}\n\n${PRESERVE_RULE}` },
    { inline_data: { mime_type: src.mime, data: toB64(src.bytes) } },
  ];

  if (args.referenceUrl || args.referenceB64) {
    const ref = await resolveImageBytes(args.referenceUrl, args.referenceB64);
    if (!ref.ok) return ref;
    parts.push({ inline_data: { mime_type: ref.mime, data: toB64(ref.bytes) } });
  }

  try {
    const res = await fetch(`${GEMINI_BASE}/${GEMINI_IMAGE_MODEL}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json?.error?.message || `Gemini HTTP ${res.status}` };

    const outParts = json?.candidates?.[0]?.content?.parts || [];
    const imgPart = outParts.find((p: any) => p?.inline_data?.data || p?.inlineData?.data);
    const b64 = imgPart?.inline_data?.data || imgPart?.inlineData?.data;
    if (!b64) return { ok: false, error: "No image returned from the editor." };
    return { ok: true, b64 };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Image edit request failed." };
  }
}

// ════════════════════════════════════════════════════════════
// OpenAI — fallback
// ════════════════════════════════════════════════════════════
async function detectElementsOpenai(imageUrl: string): Promise<DetectResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { ok: false, error: "OPENAI_API_KEY is not configured." };
  if (!isAgentForgeHostedUrl(imageUrl))
    return { ok: false, error: "Image URL is not AgentForge-hosted." };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: OPENAI_VISION_MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: DETECT_INSTRUCTION },
          {
            role: "user",
            content: [
              { type: "text", text: "Detect the changeable décor elements in this room." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json?.error?.message || `OpenAI HTTP ${res.status}` };

    const raw = json?.choices?.[0]?.message?.content?.trim();
    if (!raw) return { ok: false, error: "Empty detection response." };
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Could not parse detection JSON." };
    }
    const elements = normalizeElements(parsed);
    if (elements.length === 0) return { ok: false, error: "No editable elements detected." };
    return { ok: true, elements };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Detection request failed." };
  }
}

async function editSceneOpenai(args: EditArgs): Promise<EditResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { ok: false, error: "OPENAI_API_KEY is not configured." };

  const instruction = (args.instruction || "").trim();
  if (!instruction) return { ok: false, error: "No change instruction provided." };

  const src = await resolveImageBytes(args.imageUrl, args.imageB64);
  if (!src.ok) return src;

  let ref: { bytes: Uint8Array; mime: string } | null = null;
  if (args.referenceUrl || args.referenceB64) {
    const r = await resolveImageBytes(args.referenceUrl, args.referenceB64);
    if (!r.ok) return r;
    ref = { bytes: r.bytes, mime: r.mime };
  }

  try {
    const form = new FormData();
    form.append("model", OPENAI_IMAGE_MODEL);
    if (ref) {
      form.append("image[]", new Blob([src.bytes as BlobPart], { type: src.mime }), `scene.${extFor(src.mime)}`);
      form.append("image[]", new Blob([ref.bytes as BlobPart], { type: ref.mime }), `product.${extFor(ref.mime)}`);
    } else {
      form.append("image", new Blob([src.bytes as BlobPart], { type: src.mime }), `scene.${extFor(src.mime)}`);
    }
    form.append("prompt", `${instruction}\n\n${PRESERVE_RULE}`);
    form.append("size", "auto");
    form.append("quality", OPENAI_IMAGE_QUALITY);
    form.append("n", "1");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json?.error?.message || `OpenAI HTTP ${res.status}` };

    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) return { ok: false, error: "No image returned from the editor." };
    return { ok: true, b64 };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Image edit request failed." };
  }
}
