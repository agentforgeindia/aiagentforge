// POST /api/meetings/create-order  (PUBLIC)
// Creates a ₹99 Razorpay order for booking a meeting slot.

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { isValidSlotTime, isWorkingDay, slotIso } from "@/lib/meetingSlots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEETING_PRICE = 99; // rupees

export async function POST(req: Request) {
  try {
    const { date, time } = await req.json().catch(() => ({}));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !isWorkingDay(date))
      return NextResponse.json({ error: "Invalid or closed date." }, { status: 400 });
    if (!isValidSlotTime(String(time)) || String(time).endsWith(":30"))
      return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
    if (new Date(slotIso(date, time)).getTime() <= Date.now())
      return NextResponse.json({ error: "That slot is in the past." }, { status: 400 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret)
      return NextResponse.json({ error: "Payment not configured." }, { status: 500 });

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: MEETING_PRICE * 100,
      currency: "INR",
      receipt: `meet_${Date.now()}`,
      notes: { type: "meeting", date, time },
    });

    return NextResponse.json({
      ok: true,
      order_id: order.id,
      amount: MEETING_PRICE,
      key_id: keyId,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not start payment." }, { status: 500 });
  }
}
