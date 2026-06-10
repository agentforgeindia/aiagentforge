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
      "id, slot_id, name, email, phone, amount, status, razorpay_order_id, razorpay_payment_id, created_at",
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
