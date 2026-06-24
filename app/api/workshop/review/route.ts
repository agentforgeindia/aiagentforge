// /api/workshop/review
//   POST (PUBLIC) — submit a workshop review (lands as 'pending').
//   GET  (PUBLIC) — list APPROVED reviews for the workshop page.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

const FEEDBACK_MAX = 12;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim().slice(0, 120);
  const email = body?.email ? String(body.email).trim().slice(0, 160) : null;
  const rating = Number(body?.rating);
  const feedbackPoints: string[] = Array.isArray(body?.feedback_points)
    ? body.feedback_points
        .filter((s: unknown) => typeof s === "string")
        .slice(0, FEEDBACK_MAX)
        .map((s: string) => s.slice(0, 120))
    : [];
  const suggestions = body?.suggestions ? String(body.suggestions).slice(0, 2000) : null;
  const logoUrl = body?.logo_url ? String(body.logo_url).slice(0, 500) : null;
  const photoUrl = body?.photo_url ? String(body.photo_url).slice(0, 500) : null;
  const consent = Boolean(body?.consent);

  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return NextResponse.json({ error: "Please give a rating from 1 to 5." }, { status: 400 });

  const { error } = await db().from("workshop_reviews").insert({
    name,
    email,
    rating,
    feedback_points: feedbackPoints,
    suggestions,
    logo_url: logoUrl,
    photo_url: photoUrl,
    consent,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const { data, error } = await db()
    .from("workshop_reviews")
    .select("id, name, rating, feedback_points, suggestions, logo_url, photo_url, consent, created_at")
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(60);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, reviews: data ?? [] });
}
