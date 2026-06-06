import { NextRequest, NextResponse } from "next/server";

// ============================================================
// AgentForge — Jewellery Vision Guidance
// On upload, the page calls this to get auto-fill recommendations
// for Step 1–3. Uses Gemini 2.5 Flash (text) with vision input.
// ============================================================

const GEMINI_API_KEY =
  process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

const GEMINI_VISION_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Whitelisted values the frontend understands. AI must pick from these only.
const ALLOWED = {
  jewellery_type: ["Ring", "Earrings", "Necklace", "Bracelet", "More Options"],
  more_jewellery: [
    "Jewellery Set",
    "Payal",
    "Tikka",
    "Mangalsutra",
    "Bangles",
    "Nose Pin",
    "Pendant",
    "Chain",
    "Anklet",
    "Kada",
  ],
  shoot_style: [
    "Luxury Studio",
    "White Catalogue",
    "Bridal Editorial",
    "Macro Detail",
    "Lifestyle Campaign",
    "Indian Model",
    "Bridal Look",
    "Luxury Editorial",
    "Minimal Modern",
  ],
  accessories: [
    "No Accessories",
    "Flat Lay",
    "Velvet Box",
    "Marble Surface",
    "Silk Drape",
    "Rose Petals",
    "Marigold + Diya",
    "Diamond Sparkle Set",
    "Pearl String Decor",
    "Wooden Antique Tray",
  ],
  model_type: [
    "No Model",
    "Hand Model",
    "Couple Hands",
    "Female Model",
    "Bridal Model",
    "Luxury Flat Lay",
    "Macro Detail",
    "Ear Close-up",
    "Bust Portrait",
    "Half Body",
    "Full Body",
    "Neck Focus",
    "Neck Close-up",
    "Wrist Close-up",
    "Lifestyle Hand",
    "Detail Close-up",
    "Editorial Scene",
  ],
  pose: [
    "Auto Pose",
    "Front Pose",
    "Side Pose",
    "Half Body",
    "Full Body",
    "Bust Portrait",
    "Hand Pose",
    "Wrist Detail",
    "Couple Hands",
    "Neck Close-up",
    "Neck Tilt",
    "Touching Necklace",
    "Ear Close-up",
    "Detail Close-up",
  ],
  face_expression: ["Soft Smile", "Confident", "Serious", "Royal", "Natural"],
  camera_angle: [
    "Auto Angle",
    "Eye Level",
    "45° Angle",
    "Top Down",
    "Side Profile",
  ],
};

const SYSTEM_PROMPT = `
You are a senior Indian jewellery photographer + art director.
You are given ONE photo of a jewellery piece uploaded by an Indian D2C jewellery seller.

Your job: analyze the piece and recommend the BEST shoot configuration for it.

You MUST return a strict JSON object using ONLY values from this whitelist:

${JSON.stringify(ALLOWED, null, 2)}

Rules:
1. Pick exactly ONE value from each list (except more_jewellery which is an array — leave [] unless jewellery_type is "More Options").
2. Recommend based on what the jewellery actually IS (bridal kundan → Bridal Editorial + Bridal Model; simple silver studs → Minimal Modern + Ear Close-up; etc.).
3. "reason" must be 1 short sentence in friendly Hinglish (mixed Hindi + English) explaining WHY you picked these — natural, like talking to a shop owner. Max 22 words.
4. "detected_piece" must be a 2–4 word description of what you see (e.g. "Polki bridal necklace", "Diamond solitaire ring").
5. Return ONLY the JSON object, no markdown fences, no preamble.

Output schema:
{
  "detected_piece": string,
  "jewellery_type": one of jewellery_type,
  "more_jewellery": string[],
  "shoot_style": one of shoot_style,
  "accessories": one of accessories,
  "model_type": one of model_type,
  "pose": one of pose,
  "face_expression": one of face_expression,
  "camera_angle": one of camera_angle,
  "reason": string
}
`.trim();

async function imageUrlToBase64(url: string): Promise<{ data: string; mime: string }> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const mime = res.headers.get("content-type") || "image/png";
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString("base64"), mime };
}

function safeJsonParse(raw: string): any | null {
  if (!raw) return null;
  // strip markdown fences if Gemini added them
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function coerceToWhitelist(value: any, list: string[], fallback: string): string {
  if (typeof value !== "string") return fallback;
  const exact = list.find((x) => x === value);
  if (exact) return exact;
  const ci = list.find((x) => x.toLowerCase() === value.toLowerCase());
  return ci || fallback;
}

function normaliseSuggestion(raw: any) {
  return {
    detected_piece: typeof raw?.detected_piece === "string" ? raw.detected_piece.slice(0, 60) : "Jewellery piece",
    jewellery_type: coerceToWhitelist(raw?.jewellery_type, ALLOWED.jewellery_type, "Ring"),
    more_jewellery: Array.isArray(raw?.more_jewellery)
      ? raw.more_jewellery.filter((x: any): x is string => ALLOWED.more_jewellery.includes(x))
      : [],
    shoot_style: coerceToWhitelist(raw?.shoot_style, ALLOWED.shoot_style, "Luxury Studio"),
    accessories: coerceToWhitelist(raw?.accessories, ALLOWED.accessories, "No Accessories"),
    model_type: coerceToWhitelist(raw?.model_type, ALLOWED.model_type, "No Model"),
    pose: coerceToWhitelist(raw?.pose, ALLOWED.pose, "Auto Pose"),
    face_expression: coerceToWhitelist(raw?.face_expression, ALLOWED.face_expression, "Soft Smile"),
    camera_angle: coerceToWhitelist(raw?.camera_angle, ALLOWED.camera_angle, "Auto Angle"),
    reason: typeof raw?.reason === "string" ? raw.reason.slice(0, 200) : "AI has selected safe defaults for this piece.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { image_url } = await req.json();
    if (!image_url || typeof image_url !== "string") {
      return NextResponse.json({ error: "image_url required" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GEMINI_API_KEY missing — guidance disabled", suggestion: null },
        { status: 200 },
      );
    }

    const { data: b64, mime } = await imageUrlToBase64(image_url);

    const geminiBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            { inline_data: { mime_type: mime, data: b64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    };

    const resp = await fetch(`${GEMINI_VISION_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
      cache: "no-store",
    });

    const json: any = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error("Gemini vision error:", json);
      return NextResponse.json(
        { error: json?.error?.message || "Vision call failed", suggestion: null },
        { status: 200 },
      );
    }

    const textPart =
      json?.candidates?.[0]?.content?.parts?.find((p: any) => typeof p?.text === "string")?.text ||
      "";
    const parsed = safeJsonParse(textPart);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse AI response", suggestion: null },
        { status: 200 },
      );
    }

    const suggestion = normaliseSuggestion(parsed);

    return NextResponse.json({ success: true, suggestion });
  } catch (err: any) {
    console.error("analyze route error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected server error", suggestion: null },
      { status: 200 },
    );
  }
}
