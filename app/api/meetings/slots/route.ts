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

    const slots = daySlots()
      .map((time) => {
        const iso = slotIso(date, time);
        const ms = new Date(iso).getTime();
        return { time, iso, label: slotLabel(time), ms };
      })
      .filter((s) => s.ms > now + 60_000 && !takenMs.has(s.ms))
      .map(({ time, iso, label }) => ({ time, iso, label }));

    return NextResponse.json({ ok: true, slots, closed: false });
  } catch {
    return NextResponse.json({ ok: true, slots: [], closed: false });
  }
}
