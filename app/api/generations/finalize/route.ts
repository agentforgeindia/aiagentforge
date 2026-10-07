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

import { requireUser } from "@/lib/serverAuth";
import { serviceDb } from "@/lib/creditsServer";
import {
  MIRROR_ROW_COLUMNS,
  OUTPUT_BUCKET as BUCKET,
  currentOutputUrl,
  mirrorProviderImage,
  type MirrorableRow,
} from "@/lib/mirrorProviderImage";

export const runtime = "nodejs";

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

  const db = serviceDb();

  const { data: row, error: rowErr } = await db
    .from("generations")
    .select(`${MIRROR_ROW_COLUMNS}, status`)
    .eq("id", generationId)
    .maybeSingle();

  if (rowErr) return bad(rowErr.message, 500);
  if (!row) return bad("Generation not found.", 404);
  if (row.user_id !== user.id) return bad("Not your generation.", 403);
  if (row.status !== "completed") {
    return bad(`Generation is '${row.status}', not completed yet.`, 409);
  }

  const currentUrl = currentOutputUrl(row as unknown as MirrorableRow);

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
  const mirrored = await mirrorProviderImage(db, row as unknown as MirrorableRow);
  if (!mirrored.ok) return bad(mirrored.message, mirrored.status);
  return NextResponse.json({ success: true, output_url: mirrored.url, changed: mirrored.changed });
}
