// POST /api/meetings/book  (PUBLIC)
// Visitor self-books a slot → creates a Zoom meeting, records it, and
// pings the admin notification bell.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createZoomMeeting, zoomConfigured } from "@/lib/zoom";
import { isValidSlotTime, isWorkingDay, slotIso } from "@/lib/meetingSlots";

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { date, time, name, email, phone, meeting_type, notes } = body as Record<string, any>;

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

    // Slot still free? (guards against double-booking)
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
      status: "scheduled",
      source: "public",
      notes: notes ? String(notes).slice(0, 1000) : null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
