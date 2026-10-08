// GET /api/admin/meta-capi-events — recent Meta Conversions API events
// + a small summary. Admin-only (service role).

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
  perm: PermissionSpec = "marketing.view",
): Promise<boolean> {
  return Boolean(await adminFromAuthHeader(authHeader, perm));
}

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await db
    .from("meta_capi_events")
    .select("id, event_name, email, phone, value, currency, event_id, ok, status_code, error, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    // Table not created yet → return an empty, non-fatal result.
    return NextResponse.json({ ok: true, events: [], summary: null, note: error.message });
  }

  const events = data ?? [];
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const last24 = events.filter((e) => new Date(e.created_at).getTime() >= since);
  const summary = {
    total: events.length,
    last24: last24.length,
    sent24: last24.filter((e) => e.ok).length,
    failed24: last24.filter((e) => !e.ok).length,
    purchases24: last24.filter((e) => e.ok && e.event_name === "Purchase").length,
    revenue24: last24
      .filter((e) => e.ok && e.event_name === "Purchase")
      .reduce((s, e) => s + (Number(e.value) || 0), 0),
  };

  return NextResponse.json({ ok: true, events, summary });
}
