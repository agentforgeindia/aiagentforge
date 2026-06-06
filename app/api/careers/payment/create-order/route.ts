// POST /api/careers/payment/create-order  (PUBLIC)
// Creates a Razorpay order for the ₹500 security deposit.

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const SECURITY_AMOUNT = 500;

export async function POST(req: Request) {
  const { candidate_id } = await req.json().catch(() => ({}));
  if (!candidate_id) return NextResponse.json({ error: "candidate_id required" }, { status: 400 });

  const db = svc();

  // Verify candidate exists and is in correct stage
  const { data: cand } = await db.from("candidates")
    .select("id, name, email, stage")
    .eq("id", candidate_id)
    .maybeSingle();

  if (!cand) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  // Check for existing payment
  const { data: existingPay } = await db.from("candidate_payments")
    .select("id, status")
    .eq("candidate_id", candidate_id)
    .eq("status", "paid")
    .maybeSingle();

  if (existingPay) return NextResponse.json({ error: "Payment already completed." }, { status: 400 });

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ error: "Payment not configured." }, { status: 500 });

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const order = await razorpay.orders.create({
    amount: SECURITY_AMOUNT * 100,
    currency: "INR",
    receipt: `sec_${candidate_id.slice(0, 8)}_${Date.now()}`,
    notes: { candidate_id, type: "security_deposit" },
  });

  // Save pending payment record
  await db.from("candidate_payments").insert({
    candidate_id,
    razorpay_order_id: order.id,
    amount: SECURITY_AMOUNT,
    status: "pending",
  });

  return NextResponse.json({
    ok: true,
    order_id: order.id,
    amount: SECURITY_AMOUNT,
    currency: "INR",
    key_id: keyId,
    candidate_name: cand.name,
    candidate_email: cand.email,
  });
}
