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

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await db
    .from("demo_requests")
    .select(
      "id, agent, output_desc, output_size, quality, device, whatsapp, design_url, logo_url, status, lead_id, created_at",
    )
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

// POST { id }  → mark the demo as sent + create a lead from the number.
export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: dr, error: drErr } = await db
    .from("demo_requests")
    .select("id, agent, whatsapp, output_desc, status, lead_id")
    .eq("id", id)
    .maybeSingle();
  if (drErr || !dr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let leadId = dr.lead_id as string | null;

  // Create the lead only once.
  if (!leadId) {
    const { data: lead, error: leadErr } = await db
      .from("leads")
      .insert({
        name: `Demo lead — ${dr.agent}`,
        phone: dr.whatsapp,
        source: "whatsapp",
        source_detail: `Customize Demo — ${dr.agent}`,
        status: "new",
        notes: dr.output_desc
          ? `Booked a customize demo. Desired output: ${dr.output_desc}`
          : "Booked a customize demo.",
        tags: ["demo"],
      })
      .select("id")
      .single();
    if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 });
    leadId = lead?.id ?? null;
  }

  const { error: upErr } = await db
    .from("demo_requests")
    .update({ status: "demo_sent", lead_id: leadId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, lead_id: leadId });
}
