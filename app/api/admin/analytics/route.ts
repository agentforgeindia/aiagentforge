// GET /api/admin/analytics — combined Meta Ads + GA4 + Clarity.

import { NextResponse } from "next/server";
import { fetchMetaAds, fetchGA4, fetchClarity } from "@/lib/analyticsProviders";
import { adminFromAuthHeader, type PermissionSpec } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Valid login + ACTIVE admin + the permission for this screen/action
// (lib/adminAuth.ts). Being listed in admin_users alone is not enough.
async function isAdmin(
  authHeader: string | null,
  perm: PermissionSpec = "marketing.view",
): Promise<boolean> {
  return Boolean(await adminFromAuthHeader(authHeader, perm));
}

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization")))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [meta, ga4, clarity] = await Promise.all([fetchMetaAds(), fetchGA4(), fetchClarity()]);
  return NextResponse.json({ ok: true, meta, ga4, clarity });
}
