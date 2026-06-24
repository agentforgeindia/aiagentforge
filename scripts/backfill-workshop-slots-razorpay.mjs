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
const DEBUG = process.argv.includes("--debug");

// Razorpay Payment Page id → slot (most reliable when present in payload).
const PAGE_TO_SLOT = {
  pl_SrCcaEEG4lDJ4U: "20-june",
  pl_T0jBVjq7V3m6YC: "21-june",
  pl_T0jF2ojwXv8fB8: "27-june",
  pl_T0jC2JKtO63npD: "28-june",
  pl_T3vtDx51OXwQZv: "5-july",
  pl_T4gvADKw9grX1q: "1-july",
};

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

// Gather payment (with invoice) + order for one registration.
async function gather(orderId, paymentId) {
  let payId = paymentId && paymentId.startsWith("pay_") ? paymentId : null;
  let ordId = orderId && orderId.startsWith("order_") ? orderId : null;
  if (!payId && orderId && orderId.startsWith("pay_")) payId = orderId;

  const payment = payId ? await rzp(`/payments/${payId}?expand[]=invoice`) : null;
  if (!ordId && payment?.order_id) ordId = payment.order_id;
  const order = ordId ? await rzp(`/orders/${ordId}`) : null;
  return { payment, order };
}

// Resolve a registration's slot from any reliable signal in the payload.
function resolve(payment, order) {
  const inv = payment?.invoice || null;
  // 1. slot note on order / payment / invoice
  for (const n of [order?.notes?.slot, payment?.notes?.slot, inv?.notes?.slot]) {
    const s = (n || "").toString().trim().toLowerCase();
    if (VALID.has(s)) return s;
  }
  // 2. Payment Page id anywhere in payment+order+invoice
  let raw = "";
  try { raw = JSON.stringify(payment || {}) + JSON.stringify(order || {}); } catch { /* */ }
  for (const [pid, slot] of Object.entries(PAGE_TO_SLOT)) if (raw.includes(pid)) return slot;
  // 3. a slot string anywhere
  for (const s of VALID) if (raw.includes(s)) return s;
  // 4. "Day 0N" in the description/payload
  const m = raw.match(/day\s*0?([1-4])(?!\d)/i);
  const DAY = { 1: "20-june", 2: "21-june", 3: "27-june", 4: "28-june" };
  if (m && DAY[m[1]]) return DAY[m[1]];
  return null;
}

async function slotFor(orderId, paymentId) {
  const { payment, order } = await gather(orderId, paymentId);
  if (DEBUG) {
    console.log("\n──── DEBUG payload ────");
    console.log("PAYMENT:", JSON.stringify(payment, null, 2));
    console.log("ORDER:", JSON.stringify(order, null, 2));
    console.log("───────────────────────\n");
  }
  return resolve(payment, order);
}

const { data: rows, error } = await db
  .from("workshop_registrations")
  .select("id, email, razorpay_order_id, razorpay_payment_id, amount")
  .eq("slot_id", "unassigned");
if (error) { console.error(error.message); process.exit(1); }

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${rows.length} unassigned rows\n`);
const touched = new Set();
let fixed = 0;
for (const r of rows) {
  const slot = await slotFor(r.razorpay_order_id, r.razorpay_payment_id);
  if (DEBUG) { console.log(`(debug: ${r.email} → ${slot || "unresolved"})`); break; }
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
