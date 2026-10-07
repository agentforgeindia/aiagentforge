// GET /api/admin/workshop-certificates — certificate download log + slot counts.
// Admin-only (service role, bypasses RLS).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminFromAuthHeader, type PermissionSpec } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Valid login + ACTIVE admin + the permission for this screen/action
// (lib/adminAuth.ts). Being listed in admin_users alone is not enough.
async function isAdmin(
  authHeader: string | null,
  perm: PermissionSpec = "customers.view",
): Promise<boolean> {
  return Boolean(await adminFromAuthHeader(authHeader, perm));
}

export async function GET(req: Request) {
  const ok = await isAdmin(req.headers.get("authorization"));
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: certificates, error } = await db
    .from("workshop_certificates")
    .select("id, name, email, certificate_date, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Seat counts per slot — best-effort (table exists only if workshop.sql ran).
  let slots: unknown[] = [];
  const { data: slotRows } = await db
    .from("workshop_slots")
    .select("slot_id, label, seats_filled, max_seats")
    .order("slot_id");
  if (slotRows) slots = slotRows;

  return NextResponse.json({
    ok: true,
    certificates: certificates ?? [],
    slots,
  });
}
