// POST /api/workshop/verify  (PUBLIC)
// Verifies the Razorpay signature for a workshop payment, then
// records the seat via the atomic register_workshop_seat RPC.
// Contact details (email/phone) are pulled from the captured
// payment so no separate form is needed.

import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      slot,
    } = await req.json().catch(() => ({}));

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !slot
    ) {
      return NextResponse.json(
        { error: "Missing payment verification details." },
        { status: 400 },
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keySecret || !keyId) {
      return NextResponse.json(
        { error: "Payment not configured." },
        { status: 500 },
      );
    }

    const expectedSig = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 },
      );
    }

    // Best-effort: pull contact details + amount off the payment.
    let email: string | null = null;
    let phone: string | null = null;
    let amount = 99;
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const payment: any = await razorpay.payments.fetch(razorpay_payment_id);
      email = payment?.email ?? null;
      phone = payment?.contact ?? null;
      if (payment?.amount) amount = Number(payment.amount) / 100;
    } catch (e) {
      console.error("[workshop verify] payment fetch failed:", e);
    }

    const db = svc();

    const { data, error } = await db.rpc("register_workshop_seat", {
      p_slot_id: slot,
      p_order_id: razorpay_order_id,
      p_payment_id: razorpay_payment_id,
      p_amount: amount,
      p_name: null,
      p_email: email,
      p_phone: phone,
    });

    if (error) {
      console.error("[workshop verify] register_workshop_seat failed:", error);
      return NextResponse.json(
        { error: error.message || "Could not record registration." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, ...(data ?? {}) });
  } catch (error: any) {
    console.error("workshop verify error:", error);
    return NextResponse.json(
      { error: error?.message || "Payment verification failed." },
      { status: 500 },
    );
  }
}
