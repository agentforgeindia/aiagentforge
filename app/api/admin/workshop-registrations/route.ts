// GET /api/admin/workshop-registrations — paid workshop attendees
// (leads + purchases) from Razorpay. Admin-only (service role).

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
  const ok = await isAdmin(req.headers.get("authorization"));
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: registrations, error } = await db
    .from("workshop_registrations")
    .select(
      "id, slot_id, name, email, phone, amount, status, razorpay_order_id, razorpay_payment_id, created_at, call_status, call_notes, promoted, community_joined",
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let slots: unknown[] = [];
  const { data: slotRows } = await db
    .from("workshop_slots")
    .select("slot_id, label, seats_filled, max_seats")
    .order("slot_id");
  if (slotRows) slots = slotRows;

  return NextResponse.json({
    ok: true,
    registrations: registrations ?? [],
    slots,
  });
}

// PATCH — update a registration's calling disposition + notes, or its slot.
export async function PATCH(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, call_status, call_notes, slot_id, community_joined } = body as Record<string, any>;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, any> = {};
  if (call_status !== undefined) patch.call_status = call_status || null;
  if (call_notes !== undefined) patch.call_notes = call_notes || null;
  if (slot_id !== undefined && typeof slot_id === "string") patch.slot_id = slot_id;
  if (community_joined !== undefined) patch.community_joined = Boolean(community_joined);
  if (!Object.keys(patch).length)
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  // When moving a registration to a different slot, recompute seat counters
  // for both the old and the new slot.
  let oldSlot: string | null = null;
  if (patch.slot_id) {
    const { data: cur } = await db
      .from("workshop_registrations").select("slot_id").eq("id", id).maybeSingle();
    oldSlot = cur?.slot_id ?? null;
  }

  const { error } = await db.from("workshop_registrations").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (patch.slot_id) {
    const affected = new Set([oldSlot, patch.slot_id].filter(Boolean) as string[]);
    for (const s of affected) {
      if (s === "unassigned") continue;
      const { count } = await db
        .from("workshop_registrations")
        .select("id", { count: "exact", head: true })
        .eq("slot_id", s);
      await db.from("workshop_slots").update({ seats_filled: count ?? 0 }).eq("slot_id", s);
    }
  }

  return NextResponse.json({ ok: true });
}

// POST — promote a registration into the leads (CRM) pipeline.
export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: reg } = await db
    .from("workshop_registrations")
    .select("name, email, phone, slot_id, call_status, call_notes, promoted")
    .eq("id", id)
    .maybeSingle();
  if (!reg) return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  if (reg.promoted) return NextResponse.json({ ok: true, already: true });

  const name =
    (reg.name && String(reg.name).trim()) ||
    (reg.email ? String(reg.email).split("@")[0] : "Workshop Lead");

  const { error: leadErr } = await db.from("leads").insert({
    name,
    email: reg.email || null,
    phone: reg.phone || null,
    source: "event",
    source_detail: `Workshop attendee — ${reg.slot_id}`,
    status: "qualified",
    notes: reg.call_notes || (reg.call_status ? `Call status: ${reg.call_status}` : null),
    tags: ["workshop"],
  });
  if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 });

  await db.from("workshop_registrations").update({ promoted: true }).eq("id", id);
  return NextResponse.json({ ok: true });
}
