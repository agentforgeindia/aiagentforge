// ============================================================
// Copy a finished image from the AI provider's temporary CDN
// (fal.media) into our own storage, and point the generations
// row at the permanent copy.
// ============================================================
// Used by:
//   • /api/generations/finalize       (right after a generation)
//   • /api/cron/generation-sweeper    (anything the page missed)
//   • scripts/backfill-fal-outputs.mjs has the same logic for the
//     one-time backfill.
// Server only — needs the service-role client.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";

export const OUTPUT_BUCKET = "designs";
export const MAX_MIRROR_BYTES = 40 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export type MirrorableRow = {
  id: string;
  user_id: string | null;
  agent_type: string | null;
  output_url: string | null;
  output_image_url: string | null;
  image_url: string | null;
  original_provider_url: string | null;
};

export const MIRROR_ROW_COLUMNS =
  "id, user_id, agent_type, output_url, output_image_url, image_url, original_provider_url";

export type MirrorResult =
  | { ok: true; changed: boolean; url: string | null }
  | { ok: false; status: number; message: string; gone?: boolean };

/** The AI provider's temporary CDN. */
export function isProviderTempUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" && /(^|\.)fal\.media$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function currentOutputUrl(row: MirrorableRow): string | null {
  return row.output_url || row.output_image_url || row.image_url || null;
}

function folderFor(agentType: string | null): string {
  const agent = (agentType || "").toLowerCase();
  if (agent === "productography") return "productography-outputs";
  if (agent === "jewellery") return "jewellery-outputs";
  if (agent === "textile") return "textile-outputs";
  return "generation-outputs";
}

export async function mirrorProviderImage(
  db: SupabaseClient,
  row: MirrorableRow,
): Promise<MirrorResult> {
  const currentUrl = currentOutputUrl(row);
  if (!currentUrl || !isProviderTempUrl(currentUrl) || !row.user_id) {
    return { ok: true, changed: false, url: currentUrl };
  }

  let bytes: ArrayBuffer;
  let mime: string;
  try {
    const res = await fetch(currentUrl, { cache: "no-store" });
    if (!res.ok) {
      return {
        ok: false,
        status: 502,
        message: `The generated image is no longer available (${res.status}).`,
        // 4xx = the provider deleted it; retrying will never help.
        gone: res.status >= 400 && res.status < 500,
      };
    }
    mime = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!EXT_BY_MIME[mime]) {
      return { ok: false, status: 502, message: "Unexpected image type from provider." };
    }
    const declared = Number(res.headers.get("content-length") || 0);
    if (declared > MAX_MIRROR_BYTES) {
      return { ok: false, status: 502, message: "Generated image is too large to store." };
    }
    bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_MIRROR_BYTES) {
      return { ok: false, status: 502, message: "Generated image is too large to store." };
    }
  } catch (e) {
    return {
      ok: false,
      status: 502,
      message: e instanceof Error ? e.message : "Could not download the generated image.",
    };
  }

  const objectPath = `${folderFor(row.agent_type)}/${row.user_id}/${row.id}.${EXT_BY_MIME[mime]}`;
  const { error: upErr } = await db.storage.from(OUTPUT_BUCKET).upload(objectPath, bytes, {
    contentType: mime,
    cacheControl: "31536000",
    upsert: true,
  });
  if (upErr) {
    return { ok: false, status: 500, message: `Could not store the image: ${upErr.message}` };
  }

  const permanentUrl = db.storage.from(OUTPUT_BUCKET).getPublicUrl(objectPath).data.publicUrl;

  const { error: updErr } = await db
    .from("generations")
    .update({
      output_url: permanentUrl,
      output_image_url: permanentUrl,
      image_url: permanentUrl,
      original_provider_url: row.original_provider_url || currentUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (updErr) return { ok: false, status: 500, message: updErr.message };

  return { ok: true, changed: true, url: permanentUrl };
}
