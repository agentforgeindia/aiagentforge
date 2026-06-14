// ============================================================
// POST /api/admin/grant-access
// ============================================================
// Admin-only: manually grant a PLAN and/or custom BONUS credits to
// a user looked up by EMAIL. Built for workshop buyers / accepted
// offers where access has to be given by hand.
//
// Auth: Bearer access_token of an admin whose email is in
// public.admin_users (service-role does the writes).
//
// Body: { email, plan?, bonus_credits?, validity_days?, note? }
//   - plan ""        → don't change the plan, only add credits
//   - bonus_credits  → extra credits added on top (audit-logged)
//   - validity_days  → plan validity (default 365; 0 = lifetime)
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase env vars missing");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function isCallerAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return false;
  const admin = getServiceClient();
  const { data, error } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return false;
  const { data: row } = await admin
    .from("admin_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  return Boolean(row);
}

export async function POST(request: Request) {
  try {
    if (!(await isCallerAdmin(request.headers.get("authorization")))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const plan = String(body.plan || "").trim(); // "" = no plan change
    const bonusCredits = Math.max(0, Math.floor(Number(body.bonus_credits) || 0));
    const note = String(body.note || "").trim();
    const validityDays = Number.isFinite(Number(body.validity_days))
      ? Number(body.validity_days)
      : 365;

    if (!email) {
      return NextResponse.json({ error: "email is required." }, { status: 400 });
    }
    if (!plan && bonusCredits <= 0) {
      return NextResponse.json(
        { error: "Provide a plan, bonus credits, or both." },
        { status: 400 },
      );
    }

    const admin = getServiceClient();

    // Resolve email → user.
    const { data: prof, error: pErr } = await admin
      .from("profiles")
      .select("id, email, full_name, credits, plan")
      .ilike("email", email)
      .maybeSingle();
    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }
    if (!prof) {
      return NextResponse.json(
        { error: `No user found with email "${email}". They must sign up first.` },
        { status: 404 },
      );
    }

    // 1. Plan upgrade (core update first, expiry best-effort).
    let newPlan = prof.plan as string | null;
    if (plan) {
      const { error: uErr } = await admin
        .from("profiles")
        .update({ plan })
        .eq("id", prof.id);
      if (uErr) {
        return NextResponse.json(
          { error: `Plan update failed: ${uErr.message}` },
          { status: 500 },
        );
      }
      newPlan = plan;
      // Validity — best-effort (ignore if column absent).
      const expiry =
        validityDays > 0
          ? new Date(Date.now() + validityDays * 86400000).toISOString()
          : null;
      await admin
        .from("profiles")
        .update({ plan_expires_at: expiry })
        .eq("id", prof.id);
    }

    // 2. Bonus credits (audit-logged via the safe RPC).
    let newBalance: number | null = (prof.credits as number) ?? null;
    if (bonusCredits > 0) {
      const reason = `admin_grant${plan ? ":" + plan : ""}${note ? " — " + note : ""}`.slice(0, 200);
      const { data, error: rErr } = await admin.rpc("refund_credits", {
        p_user_id: prof.id,
        p_amount: bonusCredits,
        p_reason: reason,
        p_generation_id: `grant:${Date.now()}`,
      });
      if (rErr) {
        return NextResponse.json(
          { error: `Credit grant failed: ${rErr.message}` },
          { status: 500 },
        );
      }
      if (typeof data === "number") newBalance = data;
    }

    return NextResponse.json({
      success: true,
      user: { id: prof.id, email: prof.email, name: prof.full_name },
      plan: newPlan,
      added_credits: bonusCredits,
      new_balance: newBalance,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
