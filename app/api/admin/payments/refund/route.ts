// ============================================================
// POST /api/admin/payments/refund
// ============================================================
// Admin-only refund endpoint. Two modes:
//
//   1. via_razorpay = true  → calls Razorpay's Refund API to send
//      money back to the customer's original instrument, then
//      records the refund in our DB.
//
//   2. via_razorpay = false → does NOT touch Razorpay. Used when
//      the founder refunded out-of-band (bank transfer, cash) and
//      just wants the books to reflect it.
//
// In both modes we call process_refund() RPC which:
//   • marks the payment as refunded (full / partial)
//   • optionally deducts credits from the user's wallet
//   • writes to admin_audit
//
// Auth: bearer Supabase access_token of the calling admin.
// Permission: invoices.refund (founder + admin + accounts).
//
// SECURITY: the caller's token is verified and the permission is
// checked BEFORE anything else happens. Razorpay is only called
// once we know an active admin with invoices.refund is asking —
// money must never move on an unverified request.
// ============================================================

import { NextResponse } from "next/server";
import Razorpay from "razorpay";

import { auditAdminAction, requireAdminPermission } from "@/lib/adminAuth";

export const runtime = "nodejs";

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing");
  return new Razorpay({ key_id, key_secret });
}

type Body = {
  payment_id: string;
  amount: number;          // INR (will convert to paise for Razorpay)
  reason: string;
  deduct_credits?: boolean;
  credit_amount?: number;
  via_razorpay?: boolean;
};

export async function POST(request: Request) {
  try {
    // 1. Auth + permission — verified before any money can move.
    const admin = await requireAdminPermission(request, "invoices.refund");
    if (admin instanceof Response) return admin;

    // 2. Body
    const body = (await request.json()) as Body;
    const {
      payment_id,
      amount,
      reason,
      deduct_credits = false,
      credit_amount,
      via_razorpay = true,
    } = body;

    if (typeof payment_id !== "string" || !payment_id) {
      return NextResponse.json(
        { error: "payment_id is required" },
        { status: 400 },
      );
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be positive (in rupees)" },
        { status: 400 },
      );
    }
    if (!reason || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "A reason for the refund is required" },
        { status: 400 },
      );
    }

    // 3. Look up the payment (service role — we need the
    //    razorpay_payment_id even if RLS would hide some fields).
    const service = admin.db;
    const { data: payment, error: pErr } = await service
      .from("payments")
      .select(
        "id, user_id, plan, amount, razorpay_payment_id, status",
      )
      .eq("id", payment_id)
      .maybeSingle();

    if (pErr) {
      console.error("[refund] payment fetch error:", pErr);
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }
    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 },
      );
    }
    if (payment.status === "refunded") {
      return NextResponse.json(
        { error: "Payment is already fully refunded" },
        { status: 400 },
      );
    }
    if (amount > Number(payment.amount)) {
      return NextResponse.json(
        { error: `Refund amount ₹${amount} exceeds original ₹${payment.amount}` },
        { status: 400 },
      );
    }

    // 4. Optional Razorpay refund. We do this BEFORE the RPC so
    //    we can record razorpay_refund_id. If Razorpay fails we
    //    surface the error and skip the DB update.
    let razorpay_refund_id: string | null = null;
    if (via_razorpay) {
      if (!payment.razorpay_payment_id) {
        return NextResponse.json(
          {
            error:
              "This payment has no Razorpay payment_id (likely a manual backfill). Pass via_razorpay=false to record an out-of-band refund.",
          },
          { status: 400 },
        );
      }
      try {
        const rz = getRazorpay();
        const refund = await rz.payments.refund(payment.razorpay_payment_id, {
          amount: Math.round(amount * 100), // paise
          notes: { reason: reason.slice(0, 250) } as never,
        });
        razorpay_refund_id =
          (refund as unknown as { id?: string })?.id ?? null;
      } catch (e: any) {
        console.error("[refund] Razorpay refund failed:", e?.error ?? e);
        const msg =
          e?.error?.description ?? e?.message ?? "Razorpay refund failed";
        return NextResponse.json({ error: msg }, { status: 502 });
      }
    }

    // 5. Record the refund. process_refund() is executable by the
    //    service role only, so it runs through the service client —
    //    the caller was already verified in step 1. (It used to run
    //    with the admin's own token, which the database rejects, so
    //    Razorpay refunded the money but the payment row never changed.)
    const { data: rpcResult, error: rErr } = await service.rpc(
      "process_refund",
      {
        p_payment_id: payment_id,
        p_refund_amount: amount,
        p_reason: reason.trim(),
        p_deduct_credits: deduct_credits,
        p_credit_amount: credit_amount ?? null,
        p_razorpay_refund_id: razorpay_refund_id,
      },
    );
    if (rErr) {
      console.error("[refund] process_refund RPC error:", rErr);
      // If Razorpay refund succeeded but our DB failed, log it
      // very loudly — accounts team needs to reconcile.
      return NextResponse.json(
        {
          error: rErr.message,
          razorpay_refund_id,
          warning:
            razorpay_refund_id
              ? "Money was refunded via Razorpay but the DB row was NOT updated. Reconcile manually."
              : undefined,
        },
        { status: 500 },
      );
    }

    // The RPC ran as the service role, so stamp who actually did it.
    await service
      .from("payments")
      .update({ refunded_by: admin.userId })
      .eq("id", payment_id);
    await auditAdminAction(
      admin,
      "invoices.refund",
      { type: "payment", id: payment_id },
      {
        amount,
        reason: reason.trim(),
        via_razorpay,
        razorpay_refund_id,
        deduct_credits,
        credit_amount: credit_amount ?? null,
      },
    );

    return NextResponse.json({
      success: true,
      razorpay_refund_id,
      ...(rpcResult as object | null ?? {}),
    });
  } catch (e: any) {
    console.error("[refund] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
