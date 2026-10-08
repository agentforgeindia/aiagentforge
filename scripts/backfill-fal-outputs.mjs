// ============================================================
// Copy generated images that still live on the AI provider's
// TEMPORARY link (fal.media) into AgentForge storage, and point the
// generation row at the permanent copy.
//
// New generations are handled automatically by
// /api/generations/finalize. This script is the one-time catch-up
// for older rows (mostly Productography).
//
//   Dry run:  node scripts/backfill-fal-outputs.mjs
//   Apply:    node scripts/backfill-fal-outputs.mjs --apply
//
// Links that have already expired are reported and left unchanged —
// those images cannot be recovered.
// ============================================================
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const BUCKET = "designs";
const MAX_BYTES = 40 * 1024 * 1024;
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

const env = {};
try {
  for (const l of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const isTemp = (u) => {
  try {
    return /(^|\.)fal\.media$/i.test(new URL(u).hostname);
  } catch {
    return false;
  }
};
const folderFor = (agent) =>
  ({ productography: "productography-outputs", jewellery: "jewellery-outputs", textile: "textile-outputs" })[
    String(agent || "").toLowerCase()
  ] || "generation-outputs";

let from = 0;
const rows = [];
for (;;) {
  const { data, error } = await db
    .from("generations")
    .select("id, user_id, agent_type, output_url, output_image_url, image_url, original_provider_url, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .range(from, from + 999);
  if (error) throw error;
  if (!data?.length) break;
  rows.push(...data.filter((r) => isTemp(r.output_url || r.output_image_url || r.image_url || "")));
  from += 1000;
}

console.log(`${rows.length} completed generation(s) still point at a temporary fal.media link.`);
if (!APPLY) console.log("Dry run — nothing will be changed. Add --apply to copy them.\n");

let saved = 0;
let expired = 0;
let failed = 0;

for (const r of rows) {
  const src = r.output_url || r.output_image_url || r.image_url;
  try {
    const res = await fetch(src);
    if (!res.ok) {
      expired += 1;
      console.log(`  expired  ${r.id}  (${res.status})  ${String(r.created_at).slice(0, 10)}`);
      continue;
    }
    const mime = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!EXT[mime]) throw new Error(`unexpected type ${mime}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES) throw new Error(`bad size ${bytes.length}`);

    if (!APPLY) {
      saved += 1;
      console.log(`  alive    ${r.id}  ${(bytes.length / 1048576).toFixed(1)} MB`);
      continue;
    }

    const objectPath = `${folderFor(r.agent_type)}/${r.user_id}/${r.id}.${EXT[mime]}`;
    const up = await db.storage.from(BUCKET).upload(objectPath, bytes, {
      contentType: mime,
      cacheControl: "31536000",
      upsert: true,
    });
    if (up.error) throw up.error;
    const url = db.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
    const upd = await db
      .from("generations")
      .update({
        output_url: url,
        output_image_url: url,
        image_url: url,
        original_provider_url: r.original_provider_url || src,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);
    if (upd.error) throw upd.error;
    saved += 1;
    console.log(`  saved    ${r.id}`);
  } catch (e) {
    failed += 1;
    console.log(`  failed   ${r.id}  ${e?.message || e}`);
  }
}

console.log(
  `\n${APPLY ? "Saved" : "Still downloadable"}: ${saved}   Expired (cannot be recovered): ${expired}   Failed: ${failed}`,
);
