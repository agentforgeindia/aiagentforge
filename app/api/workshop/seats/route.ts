// GET /api/workshop/seats  (PUBLIC)
// Returns live seat counts per slot so the landing page can show
// "X seats left" / "SLOT FULL".

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  try {
    const db = svc();
    const { data, error } = await db
      .from("workshop_slots")
      .select("slot_id, seats_filled, max_seats, is_open");

    if (error) throw error;

    const slots: Record<
      string,
      { filled: number; max: number; left: number; full: boolean }
    > = {};

    for (const row of data ?? []) {
      const left = Math.max(0, row.max_seats - row.seats_filled);
      slots[row.slot_id] = {
        filled: row.seats_filled,
        max: row.max_seats,
        left,
        full: !row.is_open || left <= 0,
      };
    }

    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error("workshop seats error:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to load seats." },
      { status: 500 },
    );
  }
}
