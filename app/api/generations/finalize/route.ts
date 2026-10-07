// ============================================================
// POST /api/generations/finalize
// ============================================================
// Makes the FINAL image of a finished generation permanent and
// records it on the generations row. Called by the agent pages
// right after a generation completes.
//
// Two jobs:
//
//   1. composite_url given — the page drew the logo / article
//      number / watermark on a canvas and uploaded the result to
//      our storage. Browsers cannot update `generations` (RLS), so
//      the row is updated here, after checking that the caller owns
//      the generation and that the URL is their own upload.
//
//   2. no composite_url — if the saved output still lives on the
//      AI provider's temporary CDN (fal.media), the image is copied
//      into our storage so it does not disappear from My Creations.
//
// Body:  { generation_id: string, composite_url?: string }
// Reply: { success: true, output_url: string | null, changed: boolean }
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/serverAuth";

export const runtime = "nodejs";

const BUCKET = "designs";
const MAX_MIRROR_BYTES = 40 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** True only for a public object in OUR designs bucket, inside the caller's folder. */
function isOwnDesignsUpload(rawUrl: string, userId: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  let url: URL;
  let ours: URL;
  try {
    url = new URL(rawUrl);
    ours = new URL(base);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.host !== ours.host) return false;
  const prefix = `/storage/v1/object/public/${BUCKET}/`;
  if (!url.pathname.startsWith(prefix)) return false;
  const objectPath = decodeURIComponent(url.pathname.slice(prefix.length));
  if (objectPath.includes("..")) return false;
  return objectPath.split("/").includes(userId);
}

/** The AI provider's temporary CDN. */
function isProviderTempUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" && /(^|\.)fal\.media$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function folderFor(agentType: string | null): string {
  const agent = (agentType || "").toLowerCase();
  if (agent === "productography") return "productography-outputs";
  if (agent === "jewellery") return "jewellery-outputs";
  if (agent === "textile") return "textile-outputs";
  return "generation-outputs";
}

export async function POST(req: Request) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  let body: Record<string, unknown> | null;
  try {
    body = (await req.json()) as Record<string, unknown> | null;
  } catch {
    return bad("Invalid JSON body.");
  }

  const generationId = typeof body?.generation_id === "string" ? body.generation_id : "";
  if (!/^[0-9a-f-]{32,40}$/i.test(generationId)) {
    return bad("generation_id missing / not a UUID.");
  }
  const compositeUrl =
    typeof body?.composite_url === "string" && body.composite_url ? body.composite_url : null;

  const db = admin();

  const { data: row, error: rowErr } = await db
    .from("generations")
    .select(
      "id, user_id, status, agent_type, output_url, output_image_url, image_url, original_provider_url",
    )
    .eq("id", generationId)
    .maybeSingle();

  if (rowErr) return bad(rowErr.message, 500);
  if (!row) return bad("Generation not found.", 404);
  if (row.user_id !== user.id) return bad("Not your generation.", 403);
  if (row.status !== "completed") {
    return bad(`Generation is '${row.status}', not completed yet.`, 409);
  }

  const currentUrl: string | null =
    row.output_url || row.output_image_url || row.image_url || null;

  // ── 1. Branded composite uploaded by the page ──────────────
  if (compositeUrl) {
    if (!isOwnDesignsUpload(compositeUrl, user.id)) {
      return bad("composite_url must be your own upload in AgentForge storage.");
    }
    const patch: Record<string, unknown> = {
      output_url: compositeUrl,
      output_image_url: compositeUrl,
      updated_at: new Date().toISOString(),
    };
    if (!row.original_provider_url && currentUrl && currentUrl !== compositeUrl) {
      // Keep a pointer to the un-branded original.
      patch.original_provider_url = currentUrl;
    }
    const { error } = await db.from("generations").update(patch).eq("id", generationId);
    if (error) return bad(error.message, 500);
    return NextResponse.json({ success: true, output_url: compositeUrl, changed: true });
  }

  // ── 2. Copy a temporary provider image into our storage ────
  if (!currentUrl || !isProviderTempUrl(currentUrl)) {
    return NextResponse.json({ success: true, output_url: currentUrl, changed: false });
  }

  let bytes: ArrayBuffer;
  let mime: string;
  try {
    const res = await fetch(currentUrl, { cache: "no-store" });
    if (!res.ok) {
      return bad(`The generated image is no longer available (${res.status}).`, 502);
    }
    mime = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!EXT_BY_MIME[mime]) return bad("Unexpected image type from provider.", 502);
    const declared = Number(res.headers.get("content-length") || 0);
    if (declared > MAX_MIRROR_BYTES) return bad("Generated image is too large to store.", 502);
    bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_MIRROR_BYTES) {
      return bad("Generated image is too large to store.", 502);
    }
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Could not download the generated image.", 502);
  }

  const objectPath = `${folderFor(row.agent_type)}/${user.id}/${generationId}.${EXT_BY_MIME[mime]}`;
  const { error: upErr } = await db.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType: mime,
    cacheControl: "31536000",
    upsert: true,
  });
  if (upErr) return bad(`Could not store the image: ${upErr.message}`, 500);

  const permanentUrl = db.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;

  const { error: updErr } = await db
    .from("generations")
    .update({
      output_url: permanentUrl,
      output_image_url: permanentUrl,
      image_url: permanentUrl,
      original_provider_url: row.original_provider_url || currentUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", generationId);
  if (updErr) return bad(updErr.message, 500);

  return NextResponse.json({ success: true, output_url: permanentUrl, changed: true });
}
