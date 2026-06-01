import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PLAN_CONFIG: Record<string, { amount: number; credits: number }> = {
  Starter: { amount: 1999, credits: 1800 },
  "Pro Creator": { amount: 9999, credits: 12000 },
  Empire: { amount: 39999, credits: 50000 },
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is missing.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      amount,
      credits,
      userId,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !planName ||
      !userId
    ) {
      return NextResponse.json(
        { error: "Missing payment verification details." },
        { status: 400 },
      );
    }

    const plan = PLAN_CONFIG[planName];

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 },
      );
    }

    if (Number(amount) !== plan.amount || Number(credits) !== plan.credits) {
      return NextResponse.json(
        { error: "Plan amount or credits mismatch." },
        { status: 400 },
      );
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid Razorpay signature." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Single atomic, idempotent RPC.
    // See sql/payments-fix.sql for the function definition.
    const { data, error } = await supabaseAdmin.rpc(
      "add_credits_for_payment",
      {
        p_user_id: userId,
        p_amount: plan.amount,
        p_credits: plan.credits,
        p_plan: planName,
        p_razorpay_order_id: razorpay_order_id,
        p_razorpay_payment_id: razorpay_payment_id,
        p_razorpay_signature: razorpay_signature,
      },
    );

    if (error) {
      console.error("[verify-payment] add_credits_for_payment failed:", error);
      return NextResponse.json(
        { error: error.message || "Could not credit account." },
        { status: 500 },
      );
    }

    const result = (data ?? {}) as {
      added?: boolean;
      credits_added?: number;
      new_balance?: number;
    };

    return NextResponse.json({
      success: true,
      alreadyProcessed: !result.added,
      creditsAdded: result.credits_added ?? 0,
      totalCredits: result.new_balance ?? 0,
    });
  } catch (error: any) {
    console.error("Razorpay verify-payment error:", error);

    return NextResponse.json(
      { error: error?.message || "Payment verification failed." },
      { status: 500 },
    );
  }
}
