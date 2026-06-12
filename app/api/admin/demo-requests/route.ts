// /api/admin/demo-requests — list demo requests + mark a demo as sent.
// Admin-only (service role). Marking "demo sent" pushes the WhatsApp
// number into the leads pipeline for follow-up.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  const { data } = await db.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await db
    .from("admin_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  return !!row;
}

const SELECT_COLS =
  "id, agent, output_desc, output_size, quality, device, whatsapp, design_url, logo_url, demo_video_url, demo_still_url, demo_output_url, client_message, notes, status, lead_id, created_at, updated_at";

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Single demo for a given lead (used by the lead detail page).
  const leadId = new URL(req.url).searchParams.get("lead_id");
  if (leadId) {
    const { data, error } = await db
      .from("demo_requests")
      .select(SELECT_COLS)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, request: data ?? null });
  }

  const { data, error } = await db
    .from("demo_requests")
    .select(SELECT_COLS)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = {
    total: data?.length ?? 0,
    new: (data ?? []).filter((d) => d.status === "new").length,
    sent: (data ?? []).filter((d) => d.status !== "new").length,
  };
  return NextResponse.json({ ok: true, requests: data ?? [], counts });
}

// POST { id, name?, notes? }
// Executive action: demo sent → promote to a lead so the calling team
// can ring the client. The executive can set/update the client name and
// add notes before promoting.
export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, notes, client_message, demo_video_url, demo_still_url } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: dr, error: drErr } = await db
    .from("demo_requests")
    .select("id, agent, whatsapp, output_desc, status, lead_id")
    .eq("id", id)
    .maybeSingle();
  if (drErr || !dr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leadName = String(name || "").trim() || `Demo lead — ${dr.agent}`;
  const extraNotes = String(notes || "").trim();
  const clientMsg = String(client_message || "").trim();
  const videoUrl = String(demo_video_url || "").trim();
  const stillUrl = String(demo_still_url || "").trim();
  const leadNotes = [
    "Booked a customize demo — demo sent by executive.",
    dr.output_desc ? `Desired output: ${dr.output_desc}` : "",
    videoUrl ? `Demo video: ${videoUrl}` : "",
    stillUrl ? `Output still: ${stillUrl}` : "",
    clientMsg ? `Message sent to client: ${clientMsg}` : "",
    extraNotes ? `For calling team: ${extraNotes}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  let leadId = dr.lead_id as string | null;

  // Promote → create the lead only once (calling team picks it up here).
  if (!leadId) {
    const { data: lead, error: leadErr } = await db
      .from("leads")
      .insert({
        name: leadName,
        phone: dr.whatsapp,
        source: "whatsapp",
        source_detail: `Customize Demo — ${dr.agent} (demo sent)`,
        status: "new",
        notes: leadNotes,
        tags: ["demo"],
      })
      .select("id")
      .single();
    if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 });
    leadId = lead?.id ?? null;
  }

  const { error: upErr } = await db
    .from("demo_requests")
    .update({
      status: "demo_sent",
      lead_id: leadId,
      notes: extraNotes || null,
      client_message: clientMsg || null,
      demo_video_url: videoUrl || null,
      demo_still_url: stillUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, lead_id: leadId });
}
