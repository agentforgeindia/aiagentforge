// ============================================================
// Free Supabase Storage — delete FREE users' creations older than N
// days. PAID users are never touched. Scans every column of each
// generation row for storage URLs, so it catches input + output files
// regardless of column name.
//
//   Dry run:  node scripts/cleanup-free-creations.mjs
//   Apply:    node scripts/cleanup-free-creations.mjs --delete
//   Age:      node scripts/cleanup-free-creations.mjs --days 10 --delete
// ============================================================
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const DO_DELETE = args.includes("--delete");
const DAYS = Number(args[args.indexOf("--days") + 1]) || 10;
const CONTENT_BUCKETS = new Set(["cc-demo-videos", "post-images", "testimonial-screenshots"]);

const env = {};
try {
  for (const l of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(URL, KEY, { auth: { persistSession: false } });
const cutoff = new Date(Date.now() - DAYS * 86400000).toISOString();
const mb = (b) => (b / 1048576).toFixed(1) + " MB";

// 1. free user ids
const { data: free } = await db.from("profiles").select("id").or("plan.eq.free,plan.is.null");
const freeIds = (free || []).map((p) => p.id);
console.log(`free users: ${freeIds.length}`);

// 2. their generations older than N days → scan all columns for storage paths
const re = /\/storage\/v1\/object\/(?:public\/)?([a-z0-9_-]+)\/([^"'?\s]+)/gi;
const wanted = {}; // bucket -> Set(path)
const rowIds = [];
for (let i = 0; i < freeIds.length; i += 100) {
  const { data } = await db
    .from("generations").select("*")
    .in("user_id", freeIds.slice(i, i + 100))
    .lt("created_at", cutoff);
  for (const row of data || []) {
    rowIds.push(row.id);
    for (const v of Object.values(row)) {
      if (typeof v !== "string") continue;
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(v))) {
        const bucket = m[1];
        if (CONTENT_BUCKETS.has(bucket)) continue;
        (wanted[bucket] ||= new Set()).add(decodeURIComponent(m[2]));
      }
    }
  }
}
console.log(`free generations older than ${DAYS}d: ${rowIds.length}`);

// 3. size lookup via Storage list (and delete)
let total = 0, files = 0;
for (const [bucket, set] of Object.entries(wanted)) {
  const paths = [...set];
  files += paths.length;
  // best-effort size: list root info per file is costly, so just count here
  console.log(`  ${bucket.padEnd(20)} ${paths.length} files`);
  if (DO_DELETE) {
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await db.storage.from(bucket).remove(paths.slice(i, i + 100));
      if (error) console.error(`   remove ${bucket} failed:`, error.message);
    }
  }
  total += paths.length;
}

if (DO_DELETE && rowIds.length) {
  for (let i = 0; i < rowIds.length; i += 200)
    await db.from("generations").delete().in("id", rowIds.slice(i, i + 200));
}

console.log(`\n${DO_DELETE ? "✓ Deleted" : "Would delete"} ${total} files (${rowIds.length} rows)` +
  (DO_DELETE ? " — usage refreshes within ~1 hour" : " — re-run with --delete to apply"));
