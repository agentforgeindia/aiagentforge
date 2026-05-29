// ============================================================
// /api/stats  — public homepage counters
// ============================================================
// Returns real-time counts for the homepage live counter:
//   • total      — total completed generations (all time)
//   • last24h    — completed in the last 24 hours
//
// Uses the service-role client because RLS on `generations`
// restricts SELECT to the owning user, but an aggregate count
// is public-safe (no row data is leaked).
//
// Cached for 60s at the edge to avoid hammering Supabase from
// every page load.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
// 60-second public cache, then stale-while-revalidate for an hour.
export const revalidate = 60;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Env missing — fail quietly so the homepage just hides the counter.
    return NextResponse.json({ total: 0, last24h: 0, ok: false }, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  const db = admin();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Count rows by setting head:true so PostgREST returns just the count.
  const [totalRes, dayRes] = await Promise.all([
    db
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    db
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", since24h),
  ]);

  const total = totalRes.count ?? 0;
  const last24h = dayRes.count ?? 0;

  return NextResponse.json(
    { total, last24h, ok: true },
    {
      headers: {
        "Cache-Control":
          "public, max-age=60, stale-while-revalidate=3600",
      },
    },
  );
}
