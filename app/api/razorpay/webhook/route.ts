import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PLAN_CONFIG: Record<string, { amount: number; credits: number }> = {
  Starter: { amount: 1999, credits: 2400 },
  "Pro Creator": { amount: 9999, credits: 16000 },
  Empire: { amount: 39999, credits: 60000 },
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

function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is missing.");
  }

  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event?.event !== "payment.captured") {
      return NextResponse.json({ success: true, ignored: event?.event || "unknown_event" });
    }

    const payment = event?.payload?.payment?.entity;
    const razorpayPaymentId = payment?.id;
    const razorpayOrderId = payment?.order_id;
    const userId = payment?.notes?.userId;
    const planName = payment?.notes?.planName;

    if (!razorpayPaymentId || !razorpayOrderId || !userId || !planName) {
      return NextResponse.json({ error: "Webhook missing required payment notes." }, { status: 400 });
    }

    const plan = PLAN_CONFIG[planName];

    if (!plan) {
      return NextResponse.json({ error: "Invalid webhook plan." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingPayment, error: existingPaymentError } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("razorpay_payment_id", razorpayPaymentId)
      .maybeSingle();

    if (existingPaymentError) {
      throw existingPaymentError;
    }

    if (existingPayment) {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

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

    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        credits: newCredits,
        plan: planName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateProfileError) {
      throw updateProfileError;
    }

    const { error: insertPaymentError } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      plan_name: planName,
      amount: plan.amount,
      credits: plan.credits,
      currency: payment?.currency || "INR",
      status: "paid",
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      raw_payload: event,
    });

    if (insertPaymentError) {
      throw insertPaymentError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: error?.message || "Webhook processing failed." },
      { status: 500 }
    );
  }
}
