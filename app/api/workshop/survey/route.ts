// POST /api/workshop/survey  (PUBLIC)
// Visitor tells us their preferred day/time for the next workshop batch.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: Request) {
  try {
    const { preferred_day, preferred_time, name, phone } = await req
      .json()
      .catch(() => ({}));

    if (!preferred_day || !preferred_time)
      return NextResponse.json({ error: "Day and time are required." }, { status: 400 });

    const { error } = await svc().from("workshop_survey").insert({
      preferred_day: String(preferred_day).slice(0, 20),
      preferred_time: String(preferred_time).slice(0, 20),
      name: name ? String(name).trim().slice(0, 120) : null,
      phone: phone ? String(phone).trim().slice(0, 20) : null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed." }, { status: 500 });
  }
}
