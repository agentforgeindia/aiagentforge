// POST /api/workshop/assign-slot  (PUBLIC)
// Called by the workshop thank-you page after a hosted Razorpay Payment
// Page redirects back. Each page's redirect URL carries the correct day
// (…/workshop/thankyou/<slot>), so this route can finally pin the
// registration to the right slot — the payment payload itself never
// carries the day, which is why hosted-page registrations land as
// "unassigned". We confirm the payment is real + captured with Razorpay
// before trusting the request.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SLOTS = new Set(["20-june", "21-june", "27-june", "28-june", "1-july", "5-july", "4-july"]);

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
    const { payment_id, slot } = await req.json().catch(() => ({}));
    if (!payment_id || !slot || !VALID_SLOTS.has(slot)) {
      return NextResponse.json({ error: "Invalid payment or slot." }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment not configured." }, { status: 500 });
    }

    // Confirm the payment is real + captured before trusting the request.
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });
    if (!payRes.ok) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }
    const payment: any = await payRes.json();
    if (payment?.status !== "captured") {
      return NextResponse.json({ error: "Payment not captured." }, { status: 400 });
    }

    const db = svc();

    // 1. Move an existing *unassigned* registration onto the right day.
    //    (Never overwrite a seat already pinned to a real day.)
    const { data: updated } = await db
      .from("workshop_registrations")
      .update({ slot_id: slot })
      .eq("razorpay_payment_id", payment_id)
      .eq("slot_id", "unassigned")
      .select("id");

    // 2. No row yet (thank-you page beat the webhook) → create it correctly.
    if (!updated || updated.length === 0) {
      const orderId = payment.order_id || payment_id;
      const { data: existing } = await db
        .from("workshop_registrations")
        .select("id")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();
      if (!existing) {
        await db.rpc("register_workshop_seat", {
          p_slot_id: slot,
          p_order_id: orderId,
          p_payment_id: payment_id,
          p_amount: payment.amount ? Number(payment.amount) / 100 : 99,
          p_name: payment.notes?.name ?? null,
          p_email: payment.email ?? null,
          p_phone: payment.contact ?? null,
        });
      }
    }

    // 3. Keep the seat counters honest for the affected slots.
    for (const s of [slot, "unassigned"]) {
      const { count } = await db
        .from("workshop_registrations")
        .select("id", { count: "exact", head: true })
        .eq("slot_id", s);
      await db.from("workshop_slots").update({ seats_filled: count ?? 0 }).eq("slot_id", s);
    }

    return NextResponse.json({ ok: true, slot });
  } catch (e: any) {
    console.error("workshop assign-slot error:", e);
    return NextResponse.json({ error: e?.message || "Assign failed." }, { status: 500 });
  }
}
