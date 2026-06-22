// GET /api/meetings/slots?date=YYYY-MM-DD  (PUBLIC)
// Available 30-min slots (IST) for a given date — Mon-Sat 11:00-18:30,
// minus already-booked and past times.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { daySlots, isWorkingDay, slotIso, slotLabel } from "@/lib/meetingSlots";

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
    const now = Date.now();

    // Return ALL slots with availability flags so the UI can show
    // "seats" (1 seat per slot) — available, booked, or past.
    const slots = daySlots().map((time) => {
      const iso = slotIso(date, time);
      const ms = new Date(iso).getTime();
      const past = ms <= now + 60_000;
      const taken = takenMs.has(ms);
      return { time, iso, label: slotLabel(time), available: !past && !taken, taken, past };
    });
    const available = slots.filter((s) => s.available).length;

    return NextResponse.json({ ok: true, slots, available, total: slots.length, closed: false });
  } catch {
    return NextResponse.json({ ok: true, slots: [], closed: false });
  }
}
