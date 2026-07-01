// GET /api/meetings/slots?date=YYYY-MM-DD  (PUBLIC)
// Available 30-min slots (IST) for a given date — Mon-Sat 11:00-18:30,
// minus already-booked and past times.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { daySlots, isWorkingDay, slotIso, slotLabel } from "@/lib/meetingSlots";
import { listZoomMeetings } from "@/lib/zoom";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function GET(req: Request) {
  try {
    const date = new URL(req.url).searchParams.get("date") || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: true, slots: [], closed: false });
    }
    if (!isWorkingDay(date)) {
      return NextResponse.json({ ok: true, slots: [], closed: true, reason: "Sunday closed" });
    }

    const db = svc();
    // Booked start_times on this date (scheduled meetings only).
    const dayStart = slotIso(date, "00:00");
    const dayEnd = slotIso(date, "23:59");
    const { data: booked } = await db
      .from("meetings")
      .select("start_time")
      .eq("status", "scheduled")
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd);

    const takenMs = new Set(
      (booked || []).map((b) => new Date(b.start_time).getTime()),
    );

    // Also block slots for meetings created directly in the Zoom app (they are
    // not in our DB). Best-effort — never fail slot loading over it.
    try {
      const zoomList = await listZoomMeetings("upcoming");
      for (const z of zoomList) {
        if (z.start_time) takenMs.add(new Date(z.start_time).getTime());
      }
    } catch {
      /* ignore Zoom errors */
    }

    const now = Date.now();

    // Return ALL slots with availability flags so the UI can show
    // "seats" (1 seat per slot) — available, booked, or past.
    const slots = daySlots().map((time) => {
      const iso = slotIso(date, time);
      const ms = new Date(iso).getTime();
      const past = ms <= now + 60_000;
      // Only top-of-the-hour slots are bookable; :30 slots always show
      // as "Booked" (kept reserved on the front end).
      const half = time.endsWith(":30");
      const taken = takenMs.has(ms) || half;
      return { time, iso, label: slotLabel(time), available: !past && !taken, taken, past };
    });
    const available = slots.filter((s) => s.available).length;

    return NextResponse.json({ ok: true, slots, available, total: slots.length, closed: false });
  } catch {
    return NextResponse.json({ ok: true, slots: [], closed: false });
  }
}
