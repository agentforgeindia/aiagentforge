import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

import {
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  verifyPlanOrder,
} from "@/lib/razorpayPlans";

export const runtime = "nodejs";

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

  // Constant-time compare (both are hex strings of the same length
  // when the signature is genuine).
  const a = Buffer.from(generatedSignature);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Optional billing snapshot collected by the billing-details
      // modal on the client. Stored verbatim on the payment row
      // so the bill is reproducible later.
      billing_name,
      billing_phone,
      billing_email,
      billing_company,
      billing_address,
      billing_gstin,
    } = body;

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Missing payment verification details." },
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

    // SECURITY: the signature only proves this payment belongs to this
    // order. Which plan was bought, by whom and for how much is read back
    // from Razorpay (the order our server created) — never from the
    // request body. Without this check a paid ₹99 order could be
    // "verified" as an Empire purchase.
    const [order, payment] = await Promise.all([
      fetchRazorpayOrder(razorpay_order_id),
      fetchRazorpayPayment(razorpay_payment_id),
    ]);

    if (!order || !payment) {
      return NextResponse.json(
        {
          error:
            "Could not confirm the payment with Razorpay right now. If money was deducted, your credits will be added automatically within a few minutes.",
        },
        { status: 502 },
      );
    }

    const purchase = verifyPlanOrder(order, payment);

    if (!purchase) {
      console.error("[verify-payment] order/payment did not match a credit plan", {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });
      return NextResponse.json(
        { error: "This payment does not match a credit plan purchase." },
        { status: 400 },
      );
    }

    const { userId, planName, plan } = purchase;

    const supabaseAdmin = getSupabaseAdmin();

    // Single atomic, idempotent RPC.
    // See sql/payments-fix.sql + sql/billing-snapshot.sql.
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
        p_billing_name:    billing_name    ?? null,
        p_billing_phone:   billing_phone   ?? null,
        p_billing_email:   billing_email   ?? null,
        p_billing_company: billing_company ?? null,
        p_billing_address: billing_address ?? null,
        p_billing_gstin:   billing_gstin   ?? null,
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

    // Influencer commission — if this buyer signed up via an influencer's
    // referral code, record the commission so it shows in their dashboard.
    // Best-effort: never fail the payment response over this.
    try {
      await supabaseAdmin.rpc("record_referral_earning", {
        p_user_id: userId,
        p_order_id: razorpay_order_id,
        p_amount: plan.amount,
        p_payment_id: razorpay_payment_id,
      });
    } catch (e) {
      console.error("[verify-payment] record_referral_earning failed:", e);
    }

    // Notify the buyer in their notification bell — only on the first
    // credit (add_credits_for_payment is idempotent, so replays skip this).
    if (result.added) {
      try {
        await supabaseAdmin.rpc("add_user_notification", {
          p_user_id: userId,
          p_title: "Payment successful ✅",
          p_body: `${plan.credits.toLocaleString("en-IN")} credits added to your account (${planName} plan).`,
          p_link: "/billing",
        });
      } catch (e) {
        console.error("[verify-payment] add_user_notification failed:", e);
      }
    }

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
