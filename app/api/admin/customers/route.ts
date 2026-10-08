// GET /api/admin/customers — returns all profiles using service role (bypasses RLS)
// Admin-only endpoint

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminFromAuthHeader, type PermissionSpec } from "@/lib/adminAuth";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
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

  const { data, error } = await db
    .from("profiles")
    .select("id, email, full_name, credits, plan, referred_by, created_at, updated_at, health_score, health_status, billing_phone")
    .order("created_at", { ascending: false })  // newest first — not updated_at
    .limit(2000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, profiles: data ?? [] });
}
