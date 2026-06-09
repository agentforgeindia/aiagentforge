// GET  /api/careers/candidate/notifications?cid=UUID
//   → returns unread notifications for this candidate
// POST /api/careers/candidate/notifications
//   body: { cid, ids: string[] }  → marks those notification IDs as read

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");
  if (!cid) return NextResponse.json({ ok: false, notifications: [] });

  const { data } = await db
    .from("candidate_notifications")
    .select("id, type, title, body, stage, is_read, created_at")
    .eq("candidate_id", cid)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ ok: true, notifications: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { cid, ids } = await req.json().catch(() => ({}));
  if (!cid || !Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ ok: false });

  await db
    .from("candidate_notifications")
    .update({ is_read: true })
    .eq("candidate_id", cid)
    .in("id", ids);

  return NextResponse.json({ ok: true });
}
