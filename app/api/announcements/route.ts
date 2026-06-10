// GET /api/announcements  (PUBLIC)
// Active announcements for the user-facing notification bell.

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
      .from("announcements")
      .select("id, title, body, link, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ ok: true, announcements: data ?? [] });
  } catch (error: any) {
    // Never break the navbar over this.
    return NextResponse.json({ ok: true, announcements: [] });
  }
}
