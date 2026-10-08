// POST /api/meetings/book  (PUBLIC)
// Visitor self-books a slot → creates a Zoom meeting, records it, and
// pings the admin notification bell.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createZoomMeeting, zoomConfigured } from "@/lib/zoom";
import { isValidSlotTime, isWorkingDay, slotIso } from "@/lib/meetingSlots";
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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const TYPES = new Set(["Demo", "Sales Call", "Consultation", "Workshop", "Other"]);

const MEETING_PRICE = 99; // rupees — must match /api/meetings/create-order

export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "meetings-book", limit: 10, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const {
      date, time, name, email, phone, meeting_type, notes,
      razorpay_payment_id, razorpay_order_id, razorpay_signature,
    } = body as Record<string, any>;

    if (!name || !String(name).trim())
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!email && !phone)
      return NextResponse.json({ error: "Please enter your email or phone." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !isWorkingDay(date))
      return NextResponse.json({ error: "Invalid or closed date (Sundays closed)." }, { status: 400 });
    if (!isValidSlotTime(String(time)))
      return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
    // Only hourly slots are bookable (:30 slots are kept reserved).
    if (String(time).endsWith(":30"))
      return NextResponse.json({ error: "Please pick an hourly slot." }, { status: 400 });

    const iso = slotIso(date, time);
    if (new Date(iso).getTime() <= Date.now())
      return NextResponse.json({ error: "That slot is in the past." }, { status: 400 });

    if (!zoomConfigured())
      return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 503 });

    const db = svc();

    // ── Payment first ──────────────────────────────────────────
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !keySecret)
      return NextResponse.json({ error: "Payment is required to book a meeting." }, { status: 402 });

    const orderId = String(razorpay_order_id);
    const paymentId = String(razorpay_payment_id);
    if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId))
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });

    if (!checkoutSignatureValid(orderId, paymentId, String(razorpay_signature), keySecret))
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });

    // One payment = one meeting. If this payment already booked a
    // meeting (double click, page refresh, replayed request) hand back
    // that booking instead of creating a second Zoom meeting.
    const { data: already } = await db
      .from("meetings")
      .select("id, join_url, start_time")
      .or(`razorpay_payment_id.eq.${paymentId},razorpay_order_id.eq.${orderId}`)
      .limit(1)
      .maybeSingle();
    if (already)
      return NextResponse.json({
        ok: true,
        join_url: already.join_url,
        start_time: already.start_time,
        already_booked: true,
      });

    // The signature only proves "this payment belongs to this order".
    // Ask Razorpay what the order really was: a ₹99 MEETING order made
    // by our server, for THIS slot, and actually paid.
    const [order, payment] = await Promise.all([
      fetchRazorpayOrder(orderId),
      fetchRazorpayPayment(paymentId),
    ]);
    if (!order || !payment)
      return NextResponse.json(
        { error: "Could not confirm the payment with Razorpay. Please try again in a minute." },
        { status: 502 },
      );
    const paidFor = verifyFixedPriceOrder(order, payment, { type: "meeting", amountRupees: MEETING_PRICE });
    if (!paidFor)
      return NextResponse.json({ error: "This payment is not a meeting booking payment." }, { status: 400 });
    if (String(paidFor.date) !== String(date) || String(paidFor.time) !== String(time))
      return NextResponse.json(
        { error: "This payment was made for a different slot. Please contact support." },
        { status: 409 },
      );

    // ── Slot still free? ───────────────────────────────────────
    const { data: clash } = await db
      .from("meetings")
      .select("id")
      .eq("status", "scheduled")
      .eq("start_time", iso)
      .maybeSingle();
    if (clash)
      return NextResponse.json({ error: "Sorry, that slot was just taken. Please pick another." }, { status: 409 });

    const type = TYPES.has(meeting_type) ? meeting_type : "Demo";
    const topic = `AgentForge ${type} — ${String(name).trim()}`;

    let zoom;
    try {
      zoom = await createZoomMeeting({
        topic,
        startTime: iso,
        duration: 30,
        agenda: [type, phone && `Phone: ${phone}`, notes].filter(Boolean).join(" — ").slice(0, 1000),
      });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Could not create the meeting." }, { status: 500 });
    }

    const { error } = await db.from("meetings").insert({
      topic,
      meeting_type: type,
      name: String(name).trim().slice(0, 120),
      email: email ? String(email).trim().slice(0, 160) : null,
      phone: phone ? String(phone).trim().slice(0, 20) : null,
      start_time: iso,
      duration: 30,
      zoom_meeting_id: zoom.id,
      join_url: zoom.join_url,
      start_url: zoom.start_url,
      zoom_password: zoom.password,
      amount: MEETING_PRICE,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      status: "scheduled",
      source: "public",
      notes: notes ? String(notes).slice(0, 1000) : null,
    });
    if (error) {
      // 23505 = the unique index on razorpay_payment_id fired: a parallel
      // request booked with this payment a moment ago. Return that booking.
      if ((error as { code?: string }).code === "23505") {
        const { data: first } = await db
          .from("meetings")
          .select("join_url, start_time")
          .eq("razorpay_payment_id", paymentId)
          .maybeSingle();
        if (first)
          return NextResponse.json({
            ok: true,
            join_url: first.join_url,
            start_time: first.start_time,
            already_booked: true,
          });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ping the admin bell (best-effort).
    try {
      const when = new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
      await db.from("admin_notifications").insert({
        type: "meeting.booked",
        severity: "success",
        title: `New ${type} booked`,
        body: `${String(name).trim()} booked a ${type} on ${when}${phone ? ` · ${phone}` : ""}`,
        target_url: "/admin/meetings",
        required_permission: "leads.view",
      });
    } catch {
      /* notification is best-effort */
    }

    return NextResponse.json({ ok: true, join_url: zoom.join_url, start_time: iso });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Booking failed." }, { status: 500 });
  }
}
