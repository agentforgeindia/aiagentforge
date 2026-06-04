// GET /api/admin/integrations/status
// Returns which env vars are set (true/false) — never reveals values.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ENV_VARS = [
  "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET",
  "FAL_KEY", "OPENAI_API_KEY",
  "META_WEBHOOK_VERIFY_TOKEN", "META_APP_SECRET", "META_PAGE_ACCESS_TOKEN",
  "GOOGLE_LEADS_WEBHOOK_KEY",
  "NEXT_PUBLIC_GA4_ID",
  "RESEND_API_KEY", "RESEND_FROM_EMAIL",
  "NEXT_PUBLIC_N8N_PRODUCTION_WEBHOOK", "N8N_AGENTFORGE_AI_WEBHOOK_URL",
  "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
];

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
  const { data: row } = await admin.from("admin_users").select("email").eq("email", email).maybeSingle();
  return Boolean(row);
}

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization")))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result: Record<string, boolean> = {};
  for (const key of ENV_VARS) {
    result[key] = Boolean(process.env[key]?.trim());
  }
  return NextResponse.json(result);
}
