// POST /api/careers/details  (PUBLIC)
// Saves a passed candidate's address + landmark + geo-location +
// distance from office. Moves stage to interview_eligible.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const id = b.candidate_id;
  if (!id) return NextResponse.json({ error: "candidate_id required" }, { status: 400 });
  if (!b.address || !b.landmark) return NextResponse.json({ error: "Address and landmark required." }, { status: 400 });

  const db = svc();
  const { error } = await db.from("candidates").update({
    address:  String(b.address).slice(0, 500),
    locality: b.locality ? String(b.locality).slice(0, 200) : null,
    landmark: String(b.landmark).slice(0, 300),
    latitude:  b.latitude  ?? null,
    longitude: b.longitude ?? null,
    distance_km: b.distance_km ?? null,
    dob:              b.dob || null,
    gender:           b.gender || null,
    marital_status:   b.marital_status || null,
    qualification:    b.qualification || null,
    experience_years: b.experience_years ? Number(b.experience_years) : null,
    languages:        b.languages || null,
    current_company:  b.current_company || null,
    details_completed: true,
    stage: "interview_eligible",
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
