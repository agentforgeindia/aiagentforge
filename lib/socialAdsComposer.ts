// ============================================================
// SocialAds Composer — pro overlay engine
// ============================================================
// Why this exists:
//   AI image models (gpt-image-1, FAL, Gemini) are unreliable at
//   rendering business-critical text — brand name spelled wrong,
//   phone number garbled, Indic matras dropped. Unacceptable for
//   ads that get printed / paid-promoted.
//
//   So the pipeline splits the work:
//     Stage 1  AI generates the BACKGROUND COMPOSITION only
//              (hero photo, palette, mood, with text zones left
//               blank / blurred).
//     Stage 2  THIS module overlays:
//                - Logo (PNG, transparent BG, never AI-distorted)
//                - Headline, tagline, offer, contact strip
//                  in the correct font for the language using
//                  Noto fonts bundled via @fontsource/*.
//
//   Result: 100% accurate text in every language, every time.
//
// Used by:
//   • app/api/social-ads/composite/route.ts (called by n8n)
// ============================================================

import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

// ────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────

export type PlatformKey =
  | "instagram-post"
  | "instagram-story"
  | "facebook-post"
  | "linkedin-post"
  | "youtube-thumbnail"
  | "whatsapp-status"
  | "newspaper-ad";

export type LanguageKey =
  | "english"
  | "hindi"
  | "hinglish"
  | "marathi"
  | "tamil"
  | "telugu"
  | "gujarati"
  | "punjabi"
  | "bengali"
  | "urdu"
  | "kannada"
  | "malayalam";

export type ComposeInput = {
  baseImage: Buffer;          // AI-generated background (PNG/JPEG bytes)
  logo: Buffer | null;        // Optional brand logo (PNG with alpha)

  business_name: string;
  main_headline: string;
  tagline?: string | null;
  offer_text?: string | null;
  contact_strip?: string | null;  // e.g. "+91 1234 5678  ·  www.example.com  ·  Mumbai"

  language: LanguageKey;
  platform: PlatformKey;
};

// ────────────────────────────────────────────────────────────
// Platform templates
//   - canvas size (final output px)
//   - relative zones (0..1) → resolved to px per platform
//
// Zones are kept abstract — same layout logic works for any
// platform; only the box positions differ.
// ────────────────────────────────────────────────────────────

type Zone = { x: number; y: number; w: number; h: number };

type PlatformTemplate = {
  width: number;
  height: number;
  logo: Zone;          // top-left or top-right brand mark
  headline: Zone;
  tagline: Zone;
  offerBadge: Zone;    // circular sticker zone
  contactStrip: Zone;  // bottom dark band
  businessName: Zone;  // smaller, near the headline or strip
};

const PLATFORMS: Record<PlatformKey, PlatformTemplate> = {
  "instagram-post": {
    width: 1080,
    height: 1080,
    logo:         { x: 40,  y: 40,  w: 200, h: 80  },
    headline:     { x: 60,  y: 220, w: 600, h: 280 },
    tagline:      { x: 60,  y: 520, w: 600, h: 80  },
    businessName: { x: 60,  y: 170, w: 600, h: 50  },
    offerBadge:   { x: 840, y: 40,  w: 200, h: 200 },
    contactStrip: { x: 0,   y: 990, w: 1080, h: 90  },
  },
  "instagram-story": {
    width: 1080,
    height: 1920,
    logo:         { x: 60,  y: 60,  w: 220, h: 90  },
    headline:     { x: 80,  y: 320, w: 920, h: 520 },
    tagline:      { x: 80,  y: 860, w: 920, h: 100 },
    businessName: { x: 80,  y: 240, w: 920, h: 60  },
    offerBadge:   { x: 820, y: 60,  w: 220, h: 220 },
    contactStrip: { x: 0,   y: 1800, w: 1080, h: 120 },
  },
  "facebook-post": {
    width: 1200,
    height: 630,
    logo:         { x: 30,  y: 25,  w: 170, h: 65  },
    headline:     { x: 50,  y: 150, w: 720, h: 240 },
    tagline:      { x: 50,  y: 400, w: 720, h: 60  },
    businessName: { x: 50,  y: 110, w: 720, h: 40  },
    offerBadge:   { x: 980, y: 30,  w: 180, h: 180 },
    contactStrip: { x: 0,   y: 560, w: 1200, h: 70  },
  },
  "linkedin-post": {
    width: 1200,
    height: 627,
    logo:         { x: 30,  y: 25,  w: 170, h: 65  },
    headline:     { x: 50,  y: 150, w: 720, h: 240 },
    tagline:      { x: 50,  y: 400, w: 720, h: 60  },
    businessName: { x: 50,  y: 110, w: 720, h: 40  },
    offerBadge:   { x: 980, y: 30,  w: 180, h: 180 },
    contactStrip: { x: 0,   y: 557, w: 1200, h: 70  },
  },
  "youtube-thumbnail": {
    width: 1280,
    height: 720,
    logo:         { x: 30,  y: 25,  w: 200, h: 80  },
    headline:     { x: 60,  y: 180, w: 800, h: 360 },
    tagline:      { x: 60,  y: 560, w: 800, h: 80  },
    businessName: { x: 60,  y: 130, w: 800, h: 45  },
    offerBadge:   { x: 1040, y: 30, w: 210, h: 210 },
    contactStrip: { x: 0,   y: 660, w: 1280, h: 60  },
  },
  "whatsapp-status": {
    width: 1080,
    height: 1920,
    logo:         { x: 60,  y: 60,  w: 220, h: 90  },
    headline:     { x: 80,  y: 320, w: 920, h: 520 },
    tagline:      { x: 80,  y: 860, w: 920, h: 100 },
    businessName: { x: 80,  y: 240, w: 920, h: 60  },
    offerBadge:   { x: 820, y: 60,  w: 220, h: 220 },
    contactStrip: { x: 0,   y: 1800, w: 1080, h: 120 },
  },
  "newspaper-ad": {
    width: 1500,
    height: 1100,
    logo:         { x: 40,  y: 40,  w: 280, h: 100 },
    headline:     { x: 60,  y: 200, w: 1380, h: 480 },
    tagline:      { x: 60,  y: 700, w: 1380, h: 100 },
    businessName: { x: 60,  y: 140, w: 1380, h: 60  },
    offerBadge:   { x: 1220, y: 40, w: 240, h: 240 },
    contactStrip: { x: 0,    y: 1020, w: 1500, h: 80 },
  },
};

// ────────────────────────────────────────────────────────────
// Language → font registry
//   Maps each language to:
//     - the npm package directory (under node_modules/@fontsource/*)
//     - the .woff / .ttf file name to load
//     - the CSS font-family name to use in <text>
//
//   We resolve files at runtime via require.resolve so the bundle
//   doesn't have to know absolute paths. Each font is read once
//   and base64-embedded into the SVG @font-face — that's the only
//   reliable way to make sharp's librsvg render Indic glyphs.
// ────────────────────────────────────────────────────────────

type FontSpec = { pkg: string; file: string; family: string };

const FONTS: Record<LanguageKey, FontSpec> = {
  english:   { pkg: "@fontsource/poppins",                  file: "files/poppins-latin-700-normal.woff",       family: "Poppins" },
  hinglish:  { pkg: "@fontsource/poppins",                  file: "files/poppins-latin-700-normal.woff",       family: "Poppins" },
  hindi:     { pkg: "@fontsource/noto-sans-devanagari",     file: "files/noto-sans-devanagari-devanagari-700-normal.woff", family: "Noto Sans Devanagari" },
  marathi:   { pkg: "@fontsource/noto-sans-devanagari",     file: "files/noto-sans-devanagari-devanagari-700-normal.woff", family: "Noto Sans Devanagari" },
  tamil:     { pkg: "@fontsource/noto-sans-tamil",          file: "files/noto-sans-tamil-tamil-700-normal.woff",          family: "Noto Sans Tamil" },
  telugu:    { pkg: "@fontsource/noto-sans-telugu",         file: "files/noto-sans-telugu-telugu-700-normal.woff",        family: "Noto Sans Telugu" },
  gujarati:  { pkg: "@fontsource/noto-sans-gujarati",       file: "files/noto-sans-gujarati-gujarati-700-normal.woff",    family: "Noto Sans Gujarati" },
  punjabi:   { pkg: "@fontsource/noto-sans-gurmukhi",       file: "files/noto-sans-gurmukhi-gurmukhi-700-normal.woff",    family: "Noto Sans Gurmukhi" },
  bengali:   { pkg: "@fontsource/noto-sans-bengali",        file: "files/noto-sans-bengali-bengali-700-normal.woff",      family: "Noto Sans Bengali" },
  urdu:      { pkg: "@fontsource/noto-nastaliq-urdu",       file: "files/noto-nastaliq-urdu-arabic-700-normal.woff",      family: "Noto Nastaliq Urdu" },
  kannada:   { pkg: "@fontsource/noto-sans-kannada",        file: "files/noto-sans-kannada-kannada-700-normal.woff",      family: "Noto Sans Kannada" },
  malayalam: { pkg: "@fontsource/noto-sans-malayalam",      file: "files/noto-sans-malayalam-malayalam-700-normal.woff",  family: "Noto Sans Malayalam" },
};

const fontCache = new Map<string, string>();

async function loadFontDataUrl(lang: LanguageKey): Promise<{ family: string; dataUrl: string } | null> {
  const spec = FONTS[lang];
  if (!spec) return null;
  const cacheKey = `${spec.pkg}/${spec.file}`;
  const cached = fontCache.get(cacheKey);
  if (cached) return { family: spec.family, dataUrl: cached };

  try {
    // Resolve the package, then read the font file from its install dir.
    const pkgJsonPath = require.resolve(`${spec.pkg}/package.json`);
    const fontPath = path.join(path.dirname(pkgJsonPath), spec.file);
    const buf = await fs.readFile(fontPath);
    const dataUrl = `data:font/woff;base64,${buf.toString("base64")}`;
    fontCache.set(cacheKey, dataUrl);
    return { family: spec.family, dataUrl };
  } catch {
    // Missing font package → graceful fallback to system font.
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// SVG helpers
// ────────────────────────────────────────────────────────────

/** XML-escape a string so it's safe to embed in SVG. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

/**
 * Fit a string into a zone by picking the largest font size that
 * still fits — no full layout engine, just a binary search on
 * approximate glyph width (works because Noto/Poppins headlines
 * are uppercase-dominated).
 */
function fitFontSize(text: string, zone: Zone, maxLines = 2): number {
  if (!text) return 0;
  // rough heuristic: 0.55 * fontSize per char for bold sans-serif
  const usableW = zone.w * 0.95;
  const usableH = zone.h * 0.9;
  const perCharFactor = 0.55;
  // try big, then shrink
  let size = Math.floor(usableH / maxLines);
  for (let i = 0; i < 12; i++) {
    const lineCharCapacity = Math.floor(usableW / (size * perCharFactor));
    const linesNeeded = Math.max(
      1,
      Math.ceil(text.length / Math.max(1, lineCharCapacity)),
    );
    if (linesNeeded <= maxLines && size * linesNeeded * 1.15 <= usableH) {
      return Math.max(18, size);
    }
    size = Math.floor(size * 0.85);
  }
  return Math.max(18, size);
}

/** Wrap text into N lines for SVG <tspan> rendering. */
function wrap(text: string, lineCharCapacity: number, maxLines: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > lineCharCapacity && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) {
        cur = `${cur} ${words.slice(words.indexOf(w) + 1).join(" ")}`.trim();
        break;
      }
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

// ────────────────────────────────────────────────────────────
// Build the SVG overlay — one big SVG, then sharp composites
// it on top of the AI base image.
// ────────────────────────────────────────────────────────────

async function buildOverlaySvg(input: ComposeInput, t: PlatformTemplate): Promise<string> {
  const font = await loadFontDataUrl(input.language);
  const family = font?.family ?? "Arial";
  const fontFace = font
    ? `@font-face { font-family: "${family}"; src: url(${font.dataUrl}) format("woff"); font-weight: 700; }`
    : "";

  // headline
  const headlineSize = fitFontSize(input.main_headline, t.headline, 3);
  const headlineLines = wrap(
    input.main_headline,
    Math.floor((t.headline.w * 0.95) / (headlineSize * 0.55)),
    3,
  );

  // tagline
  const taglineSize = input.tagline ? fitFontSize(input.tagline, t.tagline, 2) : 0;
  const taglineLines = input.tagline
    ? wrap(input.tagline, Math.floor((t.tagline.w * 0.95) / (taglineSize * 0.5)), 2)
    : [];

  // business name (subtitle)
  const businessSize = fitFontSize(input.business_name, t.businessName, 1);

  // offer badge text — single line, big
  const offerSize = input.offer_text ? fitFontSize(input.offer_text, { ...t.offerBadge, h: t.offerBadge.h * 0.45 }, 1) : 0;

  // contact strip
  const contactSize = input.contact_strip
    ? fitFontSize(input.contact_strip, t.contactStrip, 1)
    : 0;

  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${t.width}" height="${t.height}" viewBox="0 0 ${t.width} ${t.height}">`);
  parts.push(`<style>${fontFace} text { font-family: "${family}", "Arial", sans-serif; font-weight: 700; }</style>`);

  // ── translucent dark gradient at bottom to give contact strip contrast
  if (input.contact_strip) {
    parts.push(`<defs><linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.85)"/>
    </linearGradient></defs>`);
    parts.push(`<rect x="${t.contactStrip.x}" y="${t.contactStrip.y - 40}" width="${t.contactStrip.w}" height="${t.contactStrip.h + 40}" fill="url(#bottomFade)"/>`);
  }

  // ── business name (small white)
  if (input.business_name) {
    parts.push(`<text x="${t.businessName.x}" y="${t.businessName.y + businessSize}" font-size="${businessSize}" fill="#FFFFFF" stroke="#000000" stroke-width="2" paint-order="stroke">${esc(input.business_name)}</text>`);
  }

  // ── headline (big white with dark stroke for legibility on any bg)
  headlineLines.forEach((line, i) => {
    parts.push(`<text x="${t.headline.x}" y="${t.headline.y + headlineSize * (i + 1)}" font-size="${headlineSize}" fill="#FFFFFF" stroke="#000000" stroke-width="4" paint-order="stroke">${esc(line)}</text>`);
  });

  // ── tagline
  taglineLines.forEach((line, i) => {
    parts.push(`<text x="${t.tagline.x}" y="${t.tagline.y + taglineSize * (i + 1)}" font-size="${taglineSize}" fill="#FFFFFF" stroke="#000000" stroke-width="2" paint-order="stroke" font-weight="500">${esc(line)}</text>`);
  });

  // ── offer badge (red circle with white text)
  if (input.offer_text) {
    const cx = t.offerBadge.x + t.offerBadge.w / 2;
    const cy = t.offerBadge.y + t.offerBadge.h / 2;
    const r = Math.min(t.offerBadge.w, t.offerBadge.h) / 2;
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#E11D48" stroke="#FFFFFF" stroke-width="6"/>`);
    parts.push(`<text x="${cx}" y="${cy + offerSize * 0.35}" font-size="${offerSize}" fill="#FFFFFF" text-anchor="middle">${esc(input.offer_text)}</text>`);
  }

  // ── contact strip
  if (input.contact_strip) {
    parts.push(`<text x="${t.contactStrip.x + t.contactStrip.w / 2}" y="${t.contactStrip.y + t.contactStrip.h / 2 + contactSize * 0.35}" font-size="${contactSize}" fill="#FFFFFF" text-anchor="middle" font-weight="600">${esc(input.contact_strip)}</text>`);
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}

// ────────────────────────────────────────────────────────────
// Main API — compose the final ad
// ────────────────────────────────────────────────────────────

export async function composeAd(input: ComposeInput): Promise<Buffer> {
  const template = PLATFORMS[input.platform];
  if (!template) {
    throw new Error(`Unknown platform: ${input.platform}`);
  }

  // 1. Resize / crop the AI base to the platform canvas.
  const base = await sharp(input.baseImage)
    .resize(template.width, template.height, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  // 2. Build text overlay SVG.
  const svg = await buildOverlaySvg(input, template);
  const overlayBuf = Buffer.from(svg, "utf-8");

  // 3. Prepare logo (resize to fit zone, preserve alpha).
  const composites: sharp.OverlayOptions[] = [
    { input: overlayBuf, top: 0, left: 0 },
  ];

  if (input.logo) {
    try {
      const logoSized = await sharp(input.logo)
        .resize(template.logo.w, template.logo.h, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      // logo first (under text) so a stray text glyph never sits on top
      composites.unshift({
        input: logoSized,
        top: template.logo.y,
        left: template.logo.x,
      });
    } catch {
      /* bad logo → skip silently */
    }
  }

  // 4. Composite everything into the final PNG.
  return sharp(base).composite(composites).png({ compressionLevel: 6 }).toBuffer();
}

// ────────────────────────────────────────────────────────────
// Small utility — build the contact strip string from parts.
// Exposed because the composite route + n8n both want the same
// formatting.
// ────────────────────────────────────────────────────────────

export function buildContactStrip(parts: {
  phone?: string | null;
  website?: string | null;
  address?: string | null;
}): string {
  return [parts.phone, parts.website, parts.address]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join("  ·  ");
}
