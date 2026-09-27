import { NextRequest, NextResponse } from "next/server";

// ============================================================
// AgentForge — Textile DESIGN READOUT (vision)
// Before generation, Gemini studies the uploaded design and returns a
// strict placement map: design type, base colour, every printed element
// with its exact position/count, and which garment areas are PLAIN.
// The textile page folds this into the prompt so the image model copies
// the design faithfully instead of inventing extra borders/lines.
// ============================================================

export const runtime = "nodejs";

const GEMINI_API_KEY =
  process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const GEMINI_VISION_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const PROMPT = (product: string) =>
  `
You are a senior textile designer preparing a production brief. The image is
an uploaded fabric / garment DESIGN that will be turned into a "${product || "garment"}"
photo mockup. Study it very carefully: colours, pattern, motifs and — most
important — PLACEMENT.

Decide the design type:
- "placement": engineered design with specific elements in fixed positions
  (borders or stripes beside the placket, framed panels, isolated motifs,
  a chest / hem motif) on an otherwise plain ground.
- "all-over": a repeating print covering the whole fabric.
- "solid": plain fabric with no print.

Return ONLY strict JSON, no markdown, in this shape:
{
  "design_type": "placement" | "all-over" | "solid",
  "base_colour": "<plain-English colour of the fabric ground, e.g. deep wine maroon>",
  "print_colours": ["<colour>", "..."],
  "elements": [
    { "what": "<short description of the element/motif>", "where": "<exact position on the garment, e.g. two vertical borders running either side of the button placket from collar to hem>", "count": <number> }
  ],
  "sleeves": "plain" | "printed" | "not shown",
  "collar_and_cuffs": "plain" | "printed" | "not shown",
  "placket": "<same colour as body | describe if different>",
  "summary": "<one sentence a photographer can follow exactly>"
}
Rules: describe ONLY what is really in the image. If the sleeves / collar /
cuffs are not shown in the design, answer "not shown" (they will be made
plain). Never invent elements. Keep every string short.
`.trim();

function safeJsonParse(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { image_url, product } = await req.json();
    if (!image_url || typeof image_url !== "string") {
      return NextResponse.json({ error: "image_url required" }, { status: 400 });
    }
    // Only analyse designs stored in our own Supabase bucket.
    if (SUPABASE_URL && !image_url.startsWith(SUPABASE_URL)) {
      return NextResponse.json({ error: "invalid image_url" }, { status: 400 });
    }
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ readout: null, reason: "no_api_key" }, { status: 200 });
    }

    const img = await fetch(image_url, { cache: "no-store" });
    if (!img.ok) throw new Error(`Image fetch failed: ${img.status}`);
    const mime = img.headers.get("content-type") || "image/png";
    const b64 = Buffer.from(await img.arrayBuffer()).toString("base64");

    const resp = await fetch(`${GEMINI_VISION_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT(typeof product === "string" ? product.slice(0, 80) : "") },
              { inline_data: { mime_type: mime, data: b64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0, topP: 0.1, responseMimeType: "application/json" },
      }),
      cache: "no-store",
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error("Textile design readout error:", json);
      return NextResponse.json({ readout: null, error: "vision_failed" }, { status: 200 });
    }
    const text =
      json?.candidates?.[0]?.content?.parts?.find(
        (p: { text?: unknown }) => typeof p?.text === "string",
      )?.text || "";
    return NextResponse.json({ readout: safeJsonParse(text) }, { status: 200 });
  } catch (err) {
    console.error("Textile design readout failed:", err);
    return NextResponse.json({ readout: null, error: "failed" }, { status: 200 });
  }
}
