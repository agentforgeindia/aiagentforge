// POST /api/workshop/certificate-log  (PUBLIC)
// Records a certificate download (name, email, workshop date) so the
// team can see who downloaded. Best-effort; never blocks the user.

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

export async function POST(req: Request) {
  try {
    const { name, email, date } = await req.json().catch(() => ({}));

    if (!name || !email || !date) {
      return NextResponse.json(
        { error: "name, email and date are required." },
        { status: 400 },
      );
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    if (!emailOk) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const db = svc();
    const { error } = await db.from("workshop_certificates").insert({
      name: String(name).trim().slice(0, 80),
      email: String(email).trim().slice(0, 120),
      certificate_date: String(date).trim().slice(0, 40),
    });

    if (error) {
      console.error("[certificate-log] insert failed:", error);
      return NextResponse.json(
        { error: error.message || "Could not save record." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("certificate-log error:", error);
    return NextResponse.json(
      { error: error?.message || "Logging failed." },
      { status: 500 },
    );
  }
}
