// POST /api/workshop/verify-certificate  (PUBLIC)
// Confirms that an email is a PAID registrant for a given workshop day
// before the certificate can be downloaded. Returns the registered name
// so the certificate uses the real name on record.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_TO_SLOT: Record<string, string> = {
  "2026-06-20": "20-june",
  "2026-06-21": "21-june",
  "2026-06-27": "27-june",
  "2026-06-28": "28-june",
  "2026-07-04": "4-july",
};

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: Request) {
  let body: { email?: string; date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ verified: false, error: "Invalid request." }, { status: 400 });
  }

  const email = String(body?.email ?? "").trim().toLowerCase();
  const slot = DATE_TO_SLOT[String(body?.date ?? "").trim()];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ verified: false, error: "Enter a valid email." }, { status: 400 });
  }
  if (!slot) {
    return NextResponse.json({ verified: false, error: "Pick a valid workshop date." }, { status: 400 });
  }

  try {
    const db = svc();
    const { data, error } = await db
      .from("workshop_registrations")
      .select("name, email, slot_id")
      .eq("slot_id", slot)
      .ilike("email", email)
      .limit(1);

    if (error) {
      return NextResponse.json({ verified: false, error: "Could not verify right now." }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        verified: false,
        error: "No registration found for this email on the selected date. Use the email you registered/paid with.",
      });
    }

    return NextResponse.json({ verified: true, name: data[0].name ?? null });
  } catch {
    return NextResponse.json({ verified: false, error: "Could not verify right now." }, { status: 500 });
  }
}
