import { NextRequest, NextResponse } from "next/server";

// ============================================================
// AgentForge — Textile Article-Number OCR (vision)
// The article / design number is usually printed ON the uploaded
// design (e.g. "X1-2364" inside a small black box in a corner).
// tesseract.js struggles with small white-on-dark labels, so this
// route uses Gemini vision to read it reliably. Returns the raw
// detected code — the frontend still normalises it.
// ============================================================

export const runtime = "nodejs";

const GEMINI_API_KEY =
  process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

const GEMINI_VISION_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `
You are an OCR engine for textile design swatches.
The image is a fabric/print design. Somewhere on it (often inside a small
coloured box in a corner, or printed along an edge) there is usually an
ARTICLE / DESIGN NUMBER — a short alphanumeric code such as
"X1-2364", "X1-2368-A", "AB-1234", "D2364", "2364".

Read that code EXACTLY as printed (preserve letters, digits, dashes, case).
Do NOT guess, do NOT invent, do NOT translate. If there are several codes,
return the most prominent one that looks like an article number (ignore
sizes like "44x44", phone numbers, web addresses and brand names).

Return ONLY strict JSON, no markdown:
{ "article_number": "<code or empty string>" }
`.trim();

async function imageUrlToBase64(
  url: string,
): Promise<{ data: string; mime: string }> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const mime = res.headers.get("content-type") || "image/png";
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString("base64"), mime };
}

function safeJsonParse(raw: string): any | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
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

export async function POST(req: NextRequest) {
  try {
    const { image_url } = await req.json();
    if (!image_url || typeof image_url !== "string") {
      return NextResponse.json({ error: "image_url required", article_number: "" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      // No key → let the client fall back to tesseract / filename.
      return NextResponse.json({ article_number: "", reason: "no_api_key" }, { status: 200 });
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
        temperature: 0,
        topP: 0.1,
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
      console.error("Textile OCR vision error:", json);
      return NextResponse.json({ article_number: "", error: json?.error?.message || "vision_failed" }, { status: 200 });
    }

    const textPart =
      json?.candidates?.[0]?.content?.parts?.find(
        (p: any) => typeof p?.text === "string",
      )?.text || "";
    const parsed = safeJsonParse(textPart);
    const code =
      parsed && typeof parsed.article_number === "string"
        ? parsed.article_number.trim().slice(0, 40)
        : "";

    return NextResponse.json({ article_number: code }, { status: 200 });
  } catch (err: any) {
    console.error("Textile OCR route error:", err);
    return NextResponse.json({ article_number: "", error: err?.message || "error" }, { status: 200 });
  }
}
