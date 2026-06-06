// POST /api/careers/payment/verify  (PUBLIC)
// Verifies Razorpay payment, updates candidate stage,
// and returns login credentials.

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: Request) {
  const { candidate_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json().catch(() => ({}));

  if (!candidate_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "All payment fields required." }, { status: 400 });
  }

  // Verify signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return NextResponse.json({ error: "Payment not configured." }, { status: 500 });

  const expectedSig = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed. Please contact support." }, { status: 400 });
  }

  const db = svc();

  // Update payment record
  await db.from("candidate_payments").update({
    razorpay_payment_id,
    status: "paid",
    paid_at: new Date().toISOString(),
  }).eq("razorpay_order_id", razorpay_order_id);

  // Fetch candidate info
  const { data: cand } = await db.from("candidates")
    .select("name, email, mobile, role_slug")
    .eq("id", candidate_id)
    .maybeSingle();

  // Generate login credentials
  const loginEmail = cand?.email || `${candidate_id.slice(0, 8)}@agentforge.team`;
  const loginPassword = generatePassword();
  const candidateCode = `AF${candidate_id.slice(0, 6).toUpperCase()}`;

  // Save credentials to payment record
  await db.from("candidate_payments").update({
    login_email: loginEmail,
    login_password: loginPassword,
  }).eq("razorpay_order_id", razorpay_order_id);

  // Update candidate stage
  await db.from("candidates").update({
    stage: "security_paid",
    updated_at: new Date().toISOString(),
  }).eq("id", candidate_id);

  // Notify HR team
  try {
    await db.from("recruitment_notifications").insert({
      candidate_id,
      candidate_name: cand?.name ?? "Unknown",
      role_slug: cand?.role_slug ?? null,
      event_type: "payment_done",
      details: { candidate_code: candidateCode, razorpay_payment_id },
    });
  } catch {}

  return NextResponse.json({
    ok: true,
    candidate_code: candidateCode,
    login_email: loginEmail,
    login_password: loginPassword,
    message: "Payment successful! Login credentials generated.",
  });
}
