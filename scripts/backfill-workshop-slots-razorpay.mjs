// Backfill "unassigned" workshop registrations by reading each payment's
// Razorpay order notes (notes.slot = "27-june" etc.) — the same signal the
// webhook now uses. Auto, no manual mapping.
//
//   Dry run:  node scripts/backfill-workshop-slots-razorpay.mjs
//   Apply:    node scripts/backfill-workshop-slots-razorpay.mjs --apply
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const VALID = new Set(["20-june", "21-june", "27-june", "28-june", "1-july", "5-july", "4-july"]);
const APPLY = process.argv.includes("--apply");

const env = {};
for (const l of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const AUTH = "Basic " + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");

async function rzp(path) {
  const r = await fetch(`https://api.razorpay.com/v1${path}`, { headers: { Authorization: AUTH } });
  if (!r.ok) return null;
  return r.json();
}

// Resolve a registration's slot from its Razorpay order notes.
async function slotFor(orderId) {
  if (!orderId) return null;
  let order = null;
  if (orderId.startsWith("order_")) {
    order = await rzp(`/orders/${orderId}`);
  } else if (orderId.startsWith("pay_")) {
    // QR/link payments stored the payment id — hop to its order.
    const pay = await rzp(`/payments/${orderId}`);
    if (pay?.order_id) order = await rzp(`/orders/${pay.order_id}`);
    const noteP = (pay?.notes?.slot || "").toString().trim().toLowerCase();
    if (VALID.has(noteP)) return noteP;
  }
  const note = (order?.notes?.slot || "").toString().trim().toLowerCase();
  return VALID.has(note) ? note : null;
}

const { data: rows, error } = await db
  .from("workshop_registrations")
  .select("id, email, razorpay_order_id, amount")
  .eq("slot_id", "unassigned");
if (error) { console.error(error.message); process.exit(1); }

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${rows.length} unassigned rows\n`);
const touched = new Set();
let fixed = 0;
for (const r of rows) {
  const slot = await slotFor(r.razorpay_order_id);
  if (!slot) { console.log(`  SKIP ${(r.email || "—").padEnd(34)} (no slot note · ₹${r.amount})`); continue; }
  console.log(`  ${(r.email || "—").padEnd(34)} → ${slot}`);
  fixed++; touched.add(slot);
  if (APPLY) {
    const { error: e } = await db.from("workshop_registrations").update({ slot_id: slot }).eq("id", r.id);
    if (e) console.error(`    failed:`, e.message);
  }
}

if (APPLY && touched.size) {
  for (const slot of touched) {
    const { count } = await db.from("workshop_registrations")
      .select("id", { count: "exact", head: true }).eq("slot_id", slot);
    await db.from("workshop_slots").update({ seats_filled: count }).eq("slot_id", slot);
  }
  console.log(`\n✓ applied — ${fixed} fixed, seat counters recomputed`);
} else {
  console.log(`\n${fixed} resolvable${APPLY ? "" : " (dry run — re-run with --apply)"}`);
}
