import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs";

const PLAN_CONFIG: Record<string, { amount: number; credits: number }> = {
  Starter: { amount: 1999, credits: 1800 },
"Pro Creator": { amount: 9999, credits: 12000 },
Empire: { amount: 39999, credits: 50000 },
};

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
    const { planName, amount, credits, userId } = body;

    if (!userId || !planName) {
      return NextResponse.json({ error: "Missing user or plan details." }, { status: 400 });
    }

    const plan = PLAN_CONFIG[planName];

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }

    if (Number(amount) !== plan.amount || Number(credits) !== plan.credits) {
      return NextResponse.json({ error: "Plan amount or credits mismatch." }, { status: 400 });
    }

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: plan.amount * 100,
      currency: "INR",
      receipt: `af_${Date.now()}`,
      notes: {
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
