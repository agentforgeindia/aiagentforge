// POST /api/workshop/verify  (PUBLIC)
// Confirms a workshop payment with Razorpay, then records the seat
// via the atomic register_workshop_seat RPC (one seat per order).
// Contact details (email/phone) are pulled from the captured
// payment so no separate form is needed.
//
// SECURITY: a checkout signature only proves "this payment belongs
// to this order". The ORDER is read back from Razorpay and must be a
// ₹99 workshop order created by /api/workshop/create-order; the seat
// is booked on the slot written in that order, not on whatever slot
// the browser sends.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  checkoutSignatureValid,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  verifyFixedPriceOrder,
} from "@/lib/razorpayPlans";
import { rateLimit } from "@/lib/rateLimit";

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

const WORKSHOP_PRICE = 99; // rupees — must match /api/workshop/create-order

export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "workshop-verify", limit: 10, windowMs: 10 * 60_000 });
  if (limited) return limited;

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
    if (!keySecret) {
      return NextResponse.json(
        { error: "Payment not configured." },
        { status: 500 },
      );
    }

    const orderId = String(razorpay_order_id);
    const paymentId = String(razorpay_payment_id);
    if (
      !/^order_[A-Za-z0-9]+$/.test(orderId) ||
      !/^pay_[A-Za-z0-9]+$/.test(paymentId) ||
      !checkoutSignatureValid(orderId, paymentId, String(razorpay_signature), keySecret)
    ) {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 },
      );
    }

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
      type: "workshop",
      amountRupees: WORKSHOP_PRICE,
    });
    if (!paidFor) {
      return NextResponse.json(
        { error: "This payment is not a workshop payment." },
        { status: 400 },
      );
    }
    // The seat goes to the slot the order was created for.
    const paidSlot = String(paidFor.slot ?? "");
    if (!paidSlot || paidSlot !== String(slot)) {
      return NextResponse.json(
        { error: "This payment was made for a different workshop day. Please contact support." },
        { status: 409 },
      );
    }

    const email = typeof payment.email === "string" ? payment.email : null;
    const phone = typeof payment.contact === "string" ? payment.contact : null;
    const amount = WORKSHOP_PRICE;

    const db = svc();

    const { data, error } = await db.rpc("register_workshop_seat", {
      p_slot_id: paidSlot,
      p_order_id: orderId,
      p_payment_id: paymentId,
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
