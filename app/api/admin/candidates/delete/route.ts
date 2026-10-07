// POST /api/admin/candidates/delete  { id }
// Permanently deletes a candidate (and cascades related records) using
// the service role, so it bypasses RLS. The anon client delete was being
// silently blocked by RLS, which is why candidates reappeared on refresh.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminFromAuthHeader, type PermissionSpec } from "@/lib/adminAuth";

export const runtime = "nodejs";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Valid login + ACTIVE admin + the permission for this screen/action
// (lib/adminAuth.ts). Being listed in admin_users alone is not enough.
async function isAdmin(
  authHeader: string | null,
  perm: PermissionSpec = "hr.manage",
): Promise<boolean> {
  return Boolean(await adminFromAuthHeader(authHeader, perm));
}

export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization")))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  // Best-effort clean up of related rows that may not have ON DELETE CASCADE.
  // (After fix-recruitment.sql these cascade, but we clear them anyway so
  //  the delete works even before that migration is applied.)
  await db.from("referral_earnings").delete().eq("candidate_id", id);
  await db.from("recruitment_notifications").delete().eq("candidate_id", id);

  const { error } = await db.from("candidates").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
