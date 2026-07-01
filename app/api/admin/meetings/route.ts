// /api/admin/meetings — list / schedule / cancel Zoom meetings. Admin only.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createZoomMeeting, deleteZoomMeeting, listZoomMeetings, zoomConfigured } from "@/lib/zoom";

// A datetime-local value ("2026-07-06T11:00") carries no timezone. The admin
// means IST. Return { zoomLocal } (naive local for Zoom + timezone) and
// { dbIso } (same instant with the +05:30 offset so the DB stores the correct
// moment instead of treating the naive string as UTC).
function normalizeStartIST(input: string): { zoomLocal: string; dbIso: string } {
  const s = String(input).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return { zoomLocal: s, dbIso: s };
  const local = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || "00"}`;
  return { zoomLocal: local, dbIso: `${local}+05:30` };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const { data } = await db.auth.getUser(authHeader.slice(7).trim());
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await db
    .from("admin_users").select("email").eq("email", email).maybeSingle();
  return !!row;
}

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await db
    .from("meetings")
    .select("id, topic, meeting_type, name, email, phone, start_time, duration, join_url, zoom_meeting_id, status, source, created_at")
    .order("start_time", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const dbMeetings = data ?? [];

  // Also pull meetings created directly in the Zoom app and merge in any that
  // aren't already tracked in our DB (dedupe by zoom_meeting_id).
  let merged = dbMeetings;
  try {
    const known = new Set(
      dbMeetings.map((m: any) => String(m.zoom_meeting_id || "")).filter(Boolean),
    );
    const zoomList = await listZoomMeetings("upcoming");
    const extras = zoomList
      .filter((z) => !known.has(String(z.id)))
      .map((z) => ({
        id: `zoom-${z.id}`,
        topic: z.topic,
        meeting_type: null,
        name: null,
        email: null,
        phone: null,
        start_time: z.start_time,
        duration: z.duration,
        join_url: z.join_url,
        zoom_meeting_id: String(z.id),
        status: "scheduled",
        source: "zoom",
        created_at: z.start_time,
      }));
    merged = [...dbMeetings, ...extras].sort((a: any, b: any) =>
      String(b.start_time).localeCompare(String(a.start_time)),
    );
  } catch {
    // Zoom listing is best-effort — never fail the whole panel over it.
  }

  return NextResponse.json({ ok: true, meetings: merged, zoomReady: zoomConfigured() });
}

export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!zoomConfigured())
    return NextResponse.json(
      { error: "Zoom is not configured. Set ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET / ZOOM_HOST_EMAIL." },
      { status: 500 },
    );

  const body = await req.json().catch(() => ({}));
  const { topic, meeting_type, name, email, phone, start_time, duration, notes } = body as Record<string, any>;

  if (!topic || !start_time)
    return NextResponse.json({ error: "topic and start_time are required." }, { status: 400 });

  const dur = Number(duration) || 30;
  const { zoomLocal, dbIso } = normalizeStartIST(String(start_time));

  let zoom;
  try {
    zoom = await createZoomMeeting({
      topic: String(topic).slice(0, 200),
      startTime: zoomLocal, // naive IST local — Zoom applies timezone Asia/Kolkata
      duration: dur,
      agenda: [meeting_type, name && `With ${name}`, notes].filter(Boolean).join(" — ").slice(0, 1000),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Zoom meeting creation failed." }, { status: 500 });
  }

  const { data, error } = await db
    .from("meetings")
    .insert({
      topic: String(topic).slice(0, 200),
      meeting_type: meeting_type || null,
      name: name || null,
      email: email || null,
      phone: phone || null,
      start_time: dbIso, // store the true IST instant (with +05:30 offset)
      duration: dur,
      zoom_meeting_id: zoom.id,
      join_url: zoom.join_url,
      start_url: zoom.start_url,
      zoom_password: zoom.password,
      status: "scheduled",
      source: "admin",
      notes: notes || null,
    })
    .select("id, join_url, start_url")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, meeting: data });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Zoom-only meeting (not in our DB): id is "zoom-<zoomMeetingId>".
  if (id.startsWith("zoom-")) {
    await deleteZoomMeeting(id.slice(5));
    return NextResponse.json({ ok: true });
  }

  const { data: row } = await db.from("meetings").select("zoom_meeting_id").eq("id", id).maybeSingle();
  if (row?.zoom_meeting_id) await deleteZoomMeeting(row.zoom_meeting_id);

  const { error } = await db.from("meetings").update({ status: "cancelled" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
