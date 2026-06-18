// ============================================================
// Delete ORPHANED storage files — files in the creation buckets that
// NO generation row references (so no user's "My Creations" shows them)
// AND are older than N days. Content buckets and referenced/paid/free
// creations are never touched.
//
//   Dry run:  node scripts/cleanup-orphans.mjs
//   Apply:    node scripts/cleanup-orphans.mjs --delete
//   Age:      node scripts/cleanup-orphans.mjs --days 10 --delete
// ============================================================
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const DO_DELETE = args.includes("--delete");
const DAYS = Number(args[args.indexOf("--days") + 1]) || 10;
const BUCKETS = ["designs", "mockups", "generation-uploads", "uploads"];

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
const cutoff = Date.now() - DAYS * 86400000;
const mb = (b) => (b / 1048576).toFixed(1);

// 1. every storage path referenced by ANY generation row (all columns)
const re = /\/storage\/v1\/object\/(?:public\/)?([a-z0-9_-]+)\/([^"'?\s]+)/gi;
const referenced = new Set();
let from = 0;
for (;;) {
  const { data } = await db.from("generations").select("*").range(from, from + 999);
  if (!data || !data.length) break;
  for (const row of data)
    for (const v of Object.values(row)) {
      if (typeof v !== "string") continue;
      let m; re.lastIndex = 0;
      while ((m = re.exec(v))) referenced.add(`${m[1]}/${decodeURIComponent(m[2])}`);
    }
  if (data.length < 1000) break;
  from += 1000;
}
console.log(`referenced creation files: ${referenced.size}`);

// 2. list buckets, pick files that are unreferenced AND older than N days
async function listAll(bucket, prefix = "") {
  let out = [], offset = 0;
  for (;;) {
    const { data } = await db.storage.from(bucket).list(prefix, { limit: 100, offset });
    if (!data || !data.length) break;
    for (const it of data) {
      const path = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null) out = out.concat(await listAll(bucket, path));
      else out.push({ path, size: Number(it.metadata?.size ?? 0), ts: new Date(it.created_at).getTime() });
    }
    if (data.length < 100) break;
    offset += 100;
  }
  return out;
}

console.log(`Mode: ${DO_DELETE ? "DELETE" : "DRY RUN"} | orphans older than ${DAYS} days\n`);
let total = 0, count = 0;
for (const bucket of BUCKETS) {
  const files = await listAll(bucket);
  const orphans = files.filter((f) => f.ts < cutoff && !referenced.has(`${bucket}/${f.path}`));
  const size = orphans.reduce((s, f) => s + f.size, 0);
  total += size; count += orphans.length;
  console.log(`${bucket.padEnd(20)} ${String(orphans.length).padStart(5)} orphans  →  ${mb(size)} MB`);
  if (DO_DELETE && orphans.length) {
    const paths = orphans.map((f) => f.path);
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await db.storage.from(bucket).remove(paths.slice(i, i + 100));
      if (error) console.error(`  remove ${bucket} failed:`, error.message);
    }
  }
}
console.log(`\n${DO_DELETE ? "✓ Freed" : "Would free"} ${mb(total)} MB (${count} files)` +
  (DO_DELETE ? " — Supabase usage refreshes within ~1 hour" : " — re-run with --delete to apply"));
