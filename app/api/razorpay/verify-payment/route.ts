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
  signature: string
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
        { status: 400 }
      );
    }

    const plan = PLAN_CONFIG[planName];

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    if (Number(amount) !== plan.amount || Number(credits) !== plan.credits) {
      return NextResponse.json(
        { error: "Plan amount or credits mismatch." },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid Razorpay signature." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Pehle check karo payment already processed hai ya nahi
    const { data: existingPayment, error: existingPaymentError } =
      await supabaseAdmin
        .from("payments")
        .select("id, credits, status")
        .eq("razorpay_payment_id", razorpay_payment_id)
        .maybeSingle();

    if (existingPaymentError) {
      throw existingPaymentError;
    }

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        creditsAdded: 0,
        message: "Payment already processed. Credits not added again.",
      });
    }

    // 2. Payment ko record karo before credits update
    // Same payment dobara hit hua to unique constraint usko rok degi
    const { error: insertPaymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        plan_name: planName,
        amount: plan.amount,
        credits: plan.credits,
        currency: "INR",
        status: "paid",
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

    if (insertPaymentError) {
      if (
        insertPaymentError.code === "23505" ||
        insertPaymentError.message?.includes("duplicate")
      ) {
        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          creditsAdded: 0,
          message: "Payment already processed. Credits not added again.",
        });
      }

      throw insertPaymentError;
    }

    // 3. Current credits lo
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    const currentCredits = Number(profile?.credits || 0);
    const newCredits = currentCredits + plan.credits;

    // 4. Credits add karo
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        credits: newCredits,
        plan: planName,
      })
      .eq("id", userId);

    if (updateProfileError) {
      throw updateProfileError;
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed: false,
      creditsAdded: plan.credits,
      totalCredits: newCredits,
    });
  } catch (error: any) {
    console.error("Razorpay verify-payment error:", error);

    return NextResponse.json(
      { error: error?.message || "Payment verification failed." },
      { status: 500 }
    );
  }
}