// GET /api/admin/analytics — combined Meta Ads + GA4 + Clarity.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchMetaAds, fetchGA4, fetchClarity } from "@/lib/analyticsProviders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await admin.from("admin_users").select("email, role").eq("email", email).maybeSingle();
  return Boolean(row);
}

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization")))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [meta, ga4, clarity] = await Promise.all([fetchMetaAds(), fetchGA4(), fetchClarity()]);
  return NextResponse.json({ ok: true, meta, ga4, clarity });
}
