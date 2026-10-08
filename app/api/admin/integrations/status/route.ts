// GET /api/admin/integrations/status
// Returns which env vars are set (true/false) — never reveals values.

import { NextResponse } from "next/server";
import { adminFromAuthHeader, type PermissionSpec } from "@/lib/adminAuth";

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

// Valid login + ACTIVE admin + the permission for this screen/action
// (lib/adminAuth.ts). Being listed in admin_users alone is not enough.
async function isAdmin(
  authHeader: string | null,
  perm: PermissionSpec = "settings.view",
): Promise<boolean> {
  return Boolean(await adminFromAuthHeader(authHeader, perm));
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
