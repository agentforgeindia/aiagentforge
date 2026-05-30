// ============================================================
// /api/social-ads/composite — INTERNAL (n8n → AgentForge)
// ============================================================
// Called by the n8n workflow once gpt-image-1 has produced a
// background image. Does the pro overlay step:
//   1. Verify shared-secret header (no JWT — this is service-to-service)
//   2. Download the AI base image + the user's logo
//   3. Call socialAdsComposer to overlay text + logo
//   4. Upload the final PNG to Supabase Storage
//   5. Return the public URL
//
// Why a dedicated route (not inside n8n):
//   • The font files and the SVG-text logic live in this repo
//     and we want them version-controlled alongside the rest of
//     the agent
//   • sharp is a heavy native dep — we don't want to install it
//     in the n8n container too
//   • The composer can be re-used by other AgentForge agents
//     later (poster maker, certificate generator…)
//
// Auth model:
//   The caller (n8n) sends `X-Internal-Secret: <env value>`.
//   We compare in constant time. If anyone gets hold of the
//   secret they can drain compute — but they CAN'T impersonate
//   another user, because the only effect is writing into
//   `social-ads-outputs/...` and returning a URL. No credit
//   deduction or user-data mutation happens here.
// ============================================================

import { NextResponse } from "next/server";
import {
  composeAd,
  buildContactStrip,
  type LanguageKey,
  type PlatformKey,
} from "@/lib/socialAdsComposer";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INTERNAL_SECRET = process.env.INTERNAL_COMPOSITE_SECRET;

// ────────────────────────────────────────────────────────────

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function downloadAsBuffer(url: string, label: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`${label} download failed: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToSupabase(
  objectPath: string,
  body: Buffer,
  contentType = "image/png",
): Promise<string> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Supabase service-role env vars missing.");
  }
  const url = `${SUPABASE_URL}/storage/v1/object/designs/${objectPath}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upload failed (${res.status}): ${text}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/designs/${objectPath}`;
}

// ────────────────────────────────────────────────────────────

type Body = {
  generation_id: string;
  user_id: string;
  variation_index: number;

  base_image_url: string;
  logo_url?: string | null;

  business_name: string;
  main_headline: string;
  tagline?: string | null;
  offer_text?: string | null;

  contact_info?: {
    phone?: string | null;
    website?: string | null;
    address?: string | null;
  } | null;

  language: LanguageKey;
  platform: PlatformKey;
};

export async function POST(request: Request) {
  // 1. Auth — shared secret.
  if (!INTERNAL_SECRET) {
    return bad("Server misconfigured: INTERNAL_COMPOSITE_SECRET unset.", 500);
  }
  const sent = request.headers.get("x-internal-secret") ?? "";
  if (!timingSafeEqual(sent, INTERNAL_SECRET)) {
    return bad("Forbidden.", 403);
  }

  // 2. Body.
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return bad("Invalid JSON.");
  }

  if (!body.generation_id || !body.user_id) {
    return bad("generation_id and user_id required.");
  }
  if (!body.base_image_url) {
    return bad("base_image_url required.");
  }
  if (!body.business_name || !body.main_headline) {
    return bad("business_name and main_headline required.");
  }

  // 3. Download base + (optional) logo.
  let baseImage: Buffer;
  try {
    baseImage = await downloadAsBuffer(body.base_image_url, "base_image_url");
  } catch (err: any) {
    return bad(err?.message ?? "base image download failed", 502);
  }

  let logo: Buffer | null = null;
  if (body.logo_url) {
    try {
      logo = await downloadAsBuffer(body.logo_url, "logo_url");
    } catch {
      // logo failure is non-fatal — proceed without
      logo = null;
    }
  }

  // 4. Compose.
  let finalPng: Buffer;
  try {
    finalPng = await composeAd({
      baseImage,
      logo,
      business_name: body.business_name,
      main_headline: body.main_headline,
      tagline: body.tagline ?? null,
      offer_text: body.offer_text ?? null,
      contact_strip: buildContactStrip(body.contact_info ?? {}),
      language: body.language,
      platform: body.platform,
    });
  } catch (err: any) {
    return bad(`compose failed: ${err?.message ?? "unknown"}`, 500);
  }

  // 5. Upload + return URL.
  const safeUid = body.user_id.replace(/[^a-zA-Z0-9-]/g, "");
  const safeGid = body.generation_id.replace(/[^a-zA-Z0-9-]/g, "");
  const objectPath = `social-ads-outputs/${safeUid}/${safeGid}-v${body.variation_index ?? 0}.png`;

  let publicUrl: string;
  try {
    publicUrl = await uploadToSupabase(objectPath, finalPng);
  } catch (err: any) {
    return bad(err?.message ?? "upload failed", 502);
  }

  return NextResponse.json({
    success: true,
    generation_id: body.generation_id,
    variation_index: body.variation_index ?? 0,
    output_url: publicUrl,
  });
}
