// ============================================================
// POST /api/admin/payments/manual
// ============================================================
// Admin-only endpoint to record a past Razorpay payment for any
// user. Used to backfill purchases that pre-date the payment
// fix (when the original verify-payment route silently failed
// to insert into `payments` because of a schema mismatch).
//
// Auth model:
//   1. Bearer token (Supabase access_token) of the calling admin.
//   2. The signed-in user's email must be in public.admin_users.
//   3. Service-role client then performs the insert + updates the
//      target user's profile.
//
// The endpoint does NOT touch credits or charge anything — it is
// purely a record-keeping operation so the user can download a
// bill from /billing for a payment that already happened.
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

type Body = {
  user_id: string;
  plan: string;
  amount: number;
  credits_added: number;
  // Optional — usually populated from Razorpay dashboard for
  // historical purchases. When absent, we synthesise a marker
  // ID so the row is still unique.
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  // Optional ISO date of the original purchase.
  created_at?: string;
  // Optional billing snapshot — usually we don't have these for
  // old buyers, but admin may key in what the user verbally
  // confirmed for the bill.
  billing_name?: string;
  billing_phone?: string;
  billing_email?: string;
  billing_company?: string;
  billing_address?: string;
  billing_gstin?: string;
  /**
   * Should we also CREDIT the user's account by credits_added?
   * Default = false. Use only when the user paid but credits
   * never landed (rare). For straight backfill of bills we
   * skip credit movement entirely.
   */
  credit_user?: boolean;
};

export async function POST(request: Request) {
  try {
    if (!(await isCallerAdmin(request.headers.get("authorization")))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Body;
    const {
      user_id,
      plan,
      amount,
      credits_added,
      razorpay_payment_id,
      razorpay_order_id,
      created_at,
      billing_name,
      billing_phone,
      billing_email,
      billing_company,
      billing_address,
      billing_gstin,
      credit_user,
    } = body;

    if (!user_id || !plan || !amount || !credits_added) {
      return NextResponse.json(
        { error: "user_id, plan, amount and credits_added are required." },
        { status: 400 },
      );
    }

    const admin = getServiceClient();

    // Synthesise a deterministic marker ID if the admin doesn't
    // have the real Razorpay payment id. The "manual:" prefix
    // makes it obvious in the ledger.
    const externalId =
      razorpay_payment_id?.trim() ||
      `manual:${user_id.slice(0, 8)}:${Date.now()}`;

    const insertPayload: Record<string, unknown> = {
      user_id,
      plan,
      amount,
      credits_added,
      status: "paid",
      razorpay_order_id: razorpay_order_id ?? null,
      razorpay_payment_id: externalId,
      razorpay_signature: null,
      billing_name:    billing_name    ?? null,
      billing_phone:   billing_phone   ?? null,
      billing_email:   billing_email   ?? null,
      billing_company: billing_company ?? null,
      billing_address: billing_address ?? null,
      billing_gstin:   billing_gstin   ?? null,
    };

    if (created_at) {
      insertPayload.created_at = new Date(created_at).toISOString();
    }

    const { data: inserted, error } = await admin
      .from("payments")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      // Duplicate razorpay_payment_id → idempotent, treat as ok.
      if (
        error.code === "23505" ||
        error.message?.toLowerCase().includes("duplicate")
      ) {
        return NextResponse.json({
          success: true,
          already_recorded: true,
        });
      }
      console.error("[admin/payments/manual] insert error:", error);
      return NextResponse.json(
        { error: error.message ?? "Insert failed" },
        { status: 500 },
      );
    }

    // Optionally credit the user's account too.
    let newBalance: number | null = null;
    if (credit_user) {
      const { data, error: rpcErr } = await admin.rpc("refund_credits", {
        p_user_id: user_id,
        p_amount: credits_added,
        p_reason: `manual_backfill:${plan}`,
        p_generation_id: externalId,
      });
      if (rpcErr) {
        console.error("[admin/payments/manual] credit add failed:", rpcErr);
      } else if (typeof data === "number") {
        newBalance = data;
      }
    }

    return NextResponse.json({
      success: true,
      payment_id: inserted.id,
      external_id: externalId,
      credited: Boolean(credit_user),
      new_balance: newBalance,
    });
  } catch (e: any) {
    console.error("[admin/payments/manual] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
