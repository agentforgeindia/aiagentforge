// /api/admin/onsite-training — list on-site training bookings + update status.
// Admin only (service role).

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
  const { data } = await db.auth.getUser(authHeader.slice(7).trim());
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await db.from("admin_users").select("email").eq("email", email).maybeSingle();
  return !!row;
}

const SELECT_COLS =
  "id, company_name, contact_person, mobile, email, city, address, industry_type, staff_count, preferred_date, preferred_time, photo_urls, notes, status, created_at";

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await db
    .from("onsite_training_bookings")
    .select(SELECT_COLS)
    .order("preferred_date", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const byCity: Record<string, number> = {};
  for (const r of rows) {
    const c = r.city || "—";
    byCity[c] = (byCity[c] || 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    bookings: rows,
    counts: {
      total: rows.length,
      new: rows.filter((r) => r.status === "new").length,
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      completed: rows.filter((r) => r.status === "completed").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
      byCity: Object.entries(byCity).map(([label, count]) => ({ label, count })),
    },
  });
}

// POST { id, status } — status in ('new','confirmed','completed','cancelled')
export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!["new", "confirmed", "completed", "cancelled"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const { error } = await db.from("onsite_training_bookings").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
