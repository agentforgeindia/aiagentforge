import { NextResponse } from "next/server";
import Razorpay from "razorpay";

import { PLAN_CONFIG, isUuid } from "@/lib/razorpayPlans";
import { getUserFromRequest } from "@/lib/serverAuth";

export const runtime = "nodejs";

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are missing in environment variables.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planName, amount, credits } = body;

    // The buyer is the signed-in user when a session token is sent
    // (billing + pricing pages). Older clients that send no token fall
    // back to the user id in the body — the order is unpaid at this
    // point, and credits only ever go to the id stored in the order's
    // server-set notes, so this cannot be used to take credits.
    const sessionUser = await getUserFromRequest(request);
    const userId = sessionUser?.id ?? body.userId;

    if (!isUuid(userId) || typeof planName !== "string" || !planName) {
      return NextResponse.json({ error: "Missing user or plan details." }, { status: 400 });
    }

    const plan = Object.prototype.hasOwnProperty.call(PLAN_CONFIG, planName)
      ? PLAN_CONFIG[planName]
      : null;

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }

    if (Number(amount) !== plan.amount || Number(credits) !== plan.credits) {
      return NextResponse.json({ error: "Plan amount or credits mismatch." }, { status: 400 });
    }

    const razorpay = getRazorpay();

    // The notes below are the ONLY record verify-payment and the webhook
    // trust for "who bought which plan". They are set here, on the server.
    const order = await razorpay.orders.create({
      amount: plan.amount * 100,
      currency: "INR",
      receipt: `af_${Date.now()}`,
      notes: {
        type: "credit_plan",
        userId,
        planName,
        credits: String(plan.credits),
      },
    });

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to create Razorpay order." },
      { status: 500 }
    );
  }
}
