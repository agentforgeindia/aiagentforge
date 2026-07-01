// POST /api/zoom/webhook — Zoom event receiver.
// Keeps our DB in sync with meetings created / changed / deleted directly in
// Zoom, so the admin panel AND the public booking slots always reflect Zoom.
//
// Setup (Zoom Marketplace → your Server-to-Server OAuth app → Feature → Event
// Subscriptions): add this URL, set the Secret Token as ZOOM_WEBHOOK_SECRET_TOKEN,
// and subscribe to: Meeting Created, Meeting Updated, Meeting Deleted.

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = process.env.ZOOM_WEBHOOK_SECRET_TOKEN || "";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: Request) {
  const raw = await req.text();
  let evt: any = {};
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // 1) URL validation handshake — Zoom expects the hashed plainToken back.
  if (evt.event === "endpoint.url_validation") {
    const plainToken = evt?.payload?.plainToken || "";
    const encryptedToken = crypto
      .createHmac("sha256", SECRET)
      .update(plainToken)
      .digest("hex");
    return NextResponse.json({ plainToken, encryptedToken });
  }

  // 2) Verify signature for real events.
  if (SECRET) {
    const ts = req.headers.get("x-zm-request-timestamp") || "";
    const sig = req.headers.get("x-zm-signature") || "";
    const expected =
      "v0=" +
      crypto.createHmac("sha256", SECRET).update(`v0:${ts}:${raw}`).digest("hex");
    if (sig !== expected) {
      return NextResponse.json({ error: "bad signature" }, { status: 401 });
    }
  }

  const obj = evt?.payload?.object || {};
  const zoomId = obj?.id ? String(obj.id) : "";
  if (!zoomId) return NextResponse.json({ ok: true });

  const supa = db();

  try {
    if (evt.event === "meeting.deleted") {
      await supa.from("meetings").update({ status: "cancelled" }).eq("zoom_meeting_id", zoomId);
      return NextResponse.json({ ok: true });
    }

    if (evt.event === "meeting.created" || evt.event === "meeting.updated") {
      // Is it already tracked (e.g. created by our own admin/public flow)?
      const { data: existing } = await supa
        .from("meetings")
        .select("id")
        .eq("zoom_meeting_id", zoomId)
        .maybeSingle();

      const row = {
        topic: obj.topic || "Zoom Meeting",
        start_time: obj.start_time || null,
        duration: Number(obj.duration) || 30,
        join_url: obj.join_url || null,
        zoom_meeting_id: zoomId,
        status: "scheduled",
      };

      if (existing) {
        // Only refresh the schedule-y fields; keep our name/email/source/payment.
        await supa
          .from("meetings")
          .update({
            topic: row.topic,
            start_time: row.start_time,
            duration: row.duration,
            status: "scheduled",
          })
          .eq("zoom_meeting_id", zoomId);
      } else {
        await supa.from("meetings").insert({ ...row, source: "zoom" });
      }
      return NextResponse.json({ ok: true });
    }
  } catch (e: any) {
    // Never make Zoom retry-storm us; log and ack.
    console.error("Zoom webhook error:", e?.message || e);
  }

  return NextResponse.json({ ok: true });
}
