// POST /api/workshop/create-order  (PUBLIC)
// Creates a Razorpay order for a ₹99 workshop seat — but only if
// the chosen slot still has room. Soft cap: a full slot never gets
// a new order, so payments stop at ~max_seats.

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKSHOP_PRICE = 99; // rupees

const VALID_SLOTS = new Set(["20-june", "21-june", "27-june", "28-june", "4-july"]);

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
    const { slot } = await req.json().catch(() => ({}));

    if (!slot || !VALID_SLOTS.has(slot)) {
      return NextResponse.json({ error: "Invalid slot." }, { status: 400 });
    }

    const db = svc();

    // Seat-availability gate (soft cap).
    const { data: slotRow, error: slotErr } = await db
      .from("workshop_slots")
      .select("seats_filled, max_seats, is_open")
      .eq("slot_id", slot)
      .maybeSingle();

    if (slotErr || !slotRow) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    if (!slotRow.is_open || slotRow.seats_filled >= slotRow.max_seats) {
      return NextResponse.json({ full: true });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment not configured." },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: WORKSHOP_PRICE * 100,
      currency: "INR",
      receipt: `wk_${slot}_${Date.now()}`,
      notes: {
        type: "workshop",
        slot,
      },
    });

    return NextResponse.json({
      ok: true,
      order_id: order.id,
      amount: WORKSHOP_PRICE,
      currency: "INR",
      key_id: keyId,
    });
  } catch (error: any) {
    console.error("workshop create-order error:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to create order." },
      { status: 500 },
    );
  }
}
