// GET /api/admin/workshop-survey — survey responses + day/time tallies. Admin only.

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
  const { data: row } = await db
    .from("admin_users").select("email").eq("email", email).maybeSingle();
  return !!row;
}

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await db
    .from("workshop_survey")
    .select("id, preferred_day, preferred_time, name, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const tally = (key: "preferred_day" | "preferred_time") => {
    const m: Record<string, number> = {};
    for (const r of rows) {
      const v = (r as any)[key];
      if (v) m[v] = (m[v] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  };

  return NextResponse.json({
    ok: true,
    total: rows.length,
    days: tally("preferred_day"),
    times: tally("preferred_time"),
    responses: rows.slice(0, 200),
  });
}
