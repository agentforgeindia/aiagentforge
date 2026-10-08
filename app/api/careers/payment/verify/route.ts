// POST /api/careers/payment/verify  (PUBLIC)
// Confirms the ₹500 security-deposit payment with Razorpay, updates the
// candidate stage and returns the candidate's login details.
//
// SECURITY: a checkout signature only proves "this payment belongs to
// this order". Any paid order (a ₹99 meeting, a workshop seat…) has a
// valid signature, so on its own it must never mark a candidate as
// paid. We therefore read the ORDER back from Razorpay and require:
//   • it was created by /api/careers/payment/create-order
//     (notes.type = "security_deposit"),
//   • for THIS candidate (notes.candidate_id — set by our server),
//   • for exactly ₹500, and the payment is authorised/captured.
// The candidate id is taken from the order, never from the request.

import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  checkoutSignatureValid,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  isUuid,
  verifyFixedPriceOrder,
} from "@/lib/razorpayPlans";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECURITY_AMOUNT = 500; // rupees — must match /api/careers/payment/create-order

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[randomInt(chars.length)]).join("");
}

export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "careers-pay-verify", limit: 10, windowMs: 10 * 60_000 });
  if (limited) return limited;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const orderId = String(body.razorpay_order_id ?? "");
  const paymentId = String(body.razorpay_payment_id ?? "");
  const signature = String(body.razorpay_signature ?? "");

  if (!body.candidate_id || !orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "All payment fields required." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return NextResponse.json({ error: "Payment not configured." }, { status: 500 });

  if (
    !/^order_[A-Za-z0-9]+$/.test(orderId) ||
    !/^pay_[A-Za-z0-9]+$/.test(paymentId) ||
    !checkoutSignatureValid(orderId, paymentId, signature, keySecret)
  ) {
    return NextResponse.json({ error: "Payment verification failed. Please contact support." }, { status: 400 });
  }

  // What was this order really for?
  const [order, payment] = await Promise.all([
    fetchRazorpayOrder(orderId),
    fetchRazorpayPayment(paymentId),
  ]);
  if (!order || !payment) {
    return NextResponse.json(
      { error: "Could not confirm the payment with Razorpay. Please try again in a minute." },
      { status: 502 },
    );
  }
  const paidFor = verifyFixedPriceOrder(order, payment, {
    type: "security_deposit",
    amountRupees: SECURITY_AMOUNT,
  });
  const candidateId = paidFor?.candidate_id;
  if (!paidFor || !isUuid(candidateId) || candidateId !== String(body.candidate_id)) {
    return NextResponse.json(
      { error: "This payment is not a security-deposit payment for this application." },
      { status: 400 },
    );
  }

  const db = svc();

  // The order must be one we recorded for this candidate.
  const { data: payRow } = await db
    .from("candidate_payments")
    .select("id, status, login_email, login_password")
    .eq("razorpay_order_id", orderId)
    .eq("candidate_id", candidateId)
    .maybeSingle();
  if (!payRow) {
    return NextResponse.json({ error: "Payment record not found. Please contact support." }, { status: 404 });
  }

  const candidateCode = `AF${candidateId.slice(0, 6).toUpperCase()}`;

  // Same payment confirmed again (refresh, double click): hand back the
  // details already issued — never a second set, never a second notice.
  if (payRow.status === "paid" && payRow.login_email && payRow.login_password) {
    return NextResponse.json({
      ok: true,
      already_verified: true,
      candidate_code: candidateCode,
      login_email: payRow.login_email,
      login_password: payRow.login_password,
      message: "Payment already verified.",
    });
  }

  const { data: cand } = await db
    .from("candidates")
    .select("name, email, mobile, role_slug")
    .eq("id", candidateId)
    .maybeSingle();
  if (!cand) return NextResponse.json({ error: "Candidate not found." }, { status: 404 });

  const loginEmail = cand.email || `${candidateId.slice(0, 8)}@agentforge.team`;
  const loginPassword = generatePassword();

  // Claim the row: only the request that flips pending → paid goes on.
  const { data: claimed } = await db
    .from("candidate_payments")
    .update({
      razorpay_payment_id: paymentId,
      status: "paid",
      paid_at: new Date().toISOString(),
      login_email: loginEmail,
      login_password: loginPassword,
    })
    .eq("id", payRow.id)
    .neq("status", "paid")
    .select("id");

  if (!claimed || claimed.length === 0) {
    // A parallel request won the claim — return what it stored.
    const { data: now } = await db
      .from("candidate_payments")
      .select("login_email, login_password")
      .eq("id", payRow.id)
      .maybeSingle();
    return NextResponse.json({
      ok: true,
      already_verified: true,
      candidate_code: candidateCode,
      login_email: now?.login_email ?? loginEmail,
      login_password: now?.login_password ?? "",
      message: "Payment already verified.",
    });
  }

  await db
    .from("candidates")
    .update({ stage: "security_paid", updated_at: new Date().toISOString() })
    .eq("id", candidateId);

  try {
    await db.from("recruitment_notifications").insert({
      candidate_id: candidateId,
      candidate_name: cand.name ?? "Unknown",
      role_slug: cand.role_slug ?? null,
      event_type: "payment_done",
      details: { candidate_code: candidateCode, razorpay_payment_id: paymentId },
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
