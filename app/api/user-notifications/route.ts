// /api/user-notifications  (logged-in user)
// GET  → the user's personal notifications
// POST → mark all of the user's notifications as read

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function userIdFromAuth(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const { data } = await db.auth.getUser(token);
  return data.user?.id ?? null;
}

export async function GET(req: Request) {
  try {
    const uid = await userIdFromAuth(req.headers.get("authorization"));
    if (!uid) return NextResponse.json({ ok: true, notifications: [] });

    const { data } = await db
      .from("user_notifications")
      .select("id, title, body, link, is_read, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);

    return NextResponse.json({ ok: true, notifications: data ?? [] });
  } catch {
    return NextResponse.json({ ok: true, notifications: [] });
  }
}

export async function POST(req: Request) {
  try {
    const uid = await userIdFromAuth(req.headers.get("authorization"));
    if (!uid) return NextResponse.json({ ok: true });

    await db
      .from("user_notifications")
      .update({ is_read: true })
      .eq("user_id", uid)
      .eq("is_read", false);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
