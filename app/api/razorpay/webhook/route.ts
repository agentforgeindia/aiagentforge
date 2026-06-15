import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PLAN_CONFIG: Record<string, { amount: number; credits: number }> = {
  Starter: { amount: 1999, credits: 1800 },
  "Pro Creator": { amount: 9999, credits: 9000 },
  Empire: { amount: 39999, credits: 36000 },
};

// Workshop slot ids seeded in sql/workshop.sql.
const WORKSHOP_SLOTS = new Set(["20-june", "21-june", "27-june", "28-june"]);

// Hosted Razorpay Payment Pages name themselves "... Day 01..04" and carry
// no app notes. Map the Day number to a slot date. EDIT this if your Day
// numbering is not chronological.
const DAY_TO_SLOT: Record<string, string> = {
  "1": "20-june",
  "2": "21-june",
  "3": "27-june",
  "4": "28-june",
};

// True for both in-app workshop checkout (notes.type='workshop') and hosted
// Payment Page workshop payments (detected by the title/description).
function looksLikeWorkshop(payment: any): boolean {
  const notes = payment?.notes || {};
  if (notes.type === "workshop") return true;
  const blob = `${payment?.description ?? ""} ${notes.title ?? ""} ${notes.description ?? ""}`;
  return /workshop/i.test(blob);
}

// Returns a valid workshop_slots slot_id, or 'unassigned' as a safe fallback
// (that row is seeded by sql/workshop-payment-page-capture.sql, so the FK and
// the admin list always accept it — the paid customer is never dropped).
function resolveWorkshopSlot(payment: any): string {
  const notes = payment?.notes || {};
  if (notes.slot && WORKSHOP_SLOTS.has(String(notes.slot))) return String(notes.slot);
  const blob = `${payment?.description ?? ""} ${notes.title ?? ""} ${notes.slot ?? ""}`;
  const m = blob.match(/day\s*0?(\d)/i);
  if (m && DAY_TO_SLOT[m[1]]) return DAY_TO_SLOT[m[1]];
  return "unassigned";
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is missing.");
  }

  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 },
      );
    }

    const event = JSON.parse(rawBody);

    if (event?.event !== "payment.captured") {
      return NextResponse.json({
        success: true,
        ignored: event?.event || "unknown_event",
      });
    }

    const payment = event?.payload?.payment?.entity;
    const razorpayPaymentId = payment?.id;
    const razorpayOrderId = payment?.order_id;
    const userId = payment?.notes?.userId;
    const planName = payment?.notes?.planName;

    // ── Workshop seat payments ──────────────────────────────────
    // Records the seat for BOTH the in-app checkout (which tags the
    // order with notes.type='workshop' + slot) AND hosted Razorpay
    // Payment Pages (links that carry no app notes), detected by the
    // payment title/description. register_workshop_seat is idempotent
    // on razorpay_order_id, so a verify + webhook double-fire is a
    // no-op. An undeterminable slot falls back to 'unassigned' so a
    // paying customer is NEVER dropped and always shows in the admin.
    if (looksLikeWorkshop(payment)) {
      const supabaseAdmin = getSupabaseAdmin();
      const slot = resolveWorkshopSlot(payment);
      const { error: wkErr } = await supabaseAdmin.rpc(
        "register_workshop_seat",
        {
          p_slot_id: slot,
          p_order_id: razorpayOrderId,
          p_payment_id: razorpayPaymentId,
          p_amount: payment?.amount ? Number(payment.amount) / 100 : 99,
          p_name: payment?.notes?.name ?? null,
          p_email: payment?.email ?? null,
          p_phone: payment?.contact ?? null,
        },
      );
      if (wkErr) {
        console.error("[razorpay-webhook] register_workshop_seat failed:", wkErr);
        return NextResponse.json(
          { error: wkErr.message || "Could not record seat." },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true, workshop: true, slot });
    }

    if (!razorpayPaymentId || !razorpayOrderId || !userId || !planName) {
      return NextResponse.json(
        { error: "Webhook missing required payment notes." },
        { status: 400 },
      );
    }

    const plan = PLAN_CONFIG[planName];

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid webhook plan." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Single atomic, idempotent RPC — same one used by verify-payment.
    // If Razorpay retries this webhook (or verify-payment ran first),
    // the ON CONFLICT in the SQL function makes it a safe no-op.
    // Billing snapshot is not available on the webhook path
    // (Meta-style server-to-server delivery has no client form),
    // but ON CONFLICT means the verify-payment route always wins
    // when both fire.
    const { data, error } = await supabaseAdmin.rpc(
      "add_credits_for_payment",
      {
        p_user_id: userId,
        p_amount: plan.amount,
        p_credits: plan.credits,
        p_plan: planName,
        p_razorpay_order_id: razorpayOrderId,
        p_razorpay_payment_id: razorpayPaymentId,
        p_razorpay_signature: signature,
        p_billing_name:    null,
        p_billing_phone:   null,
        p_billing_email:   null,
        p_billing_company: null,
        p_billing_address: null,
        p_billing_gstin:   null,
      },
    );

    if (error) {
      console.error("[razorpay-webhook] add_credits_for_payment failed:", error);
      try {
        await supabaseAdmin.rpc("log_error", {
          p_category: "payment", p_source: "razorpay-webhook",
          p_message: error.message || "add_credits_for_payment failed",
          p_details: { error }, p_user_id: null,
        });
      } catch { /* logging must not block */ }
      return NextResponse.json(
        { error: error.message || "Could not credit account." },
        { status: 500 },
      );
    }

    const result = (data ?? {}) as {
      added?: boolean;
      credits_added?: number;
      new_balance?: number;
    };

    // Influencer commission — idempotent per order_id, safe if verify-payment
    // already recorded it.
    try {
      await supabaseAdmin.rpc("record_referral_earning", {
        p_user_id: userId,
        p_order_id: razorpayOrderId,
        p_amount: plan.amount,
        p_payment_id: razorpayPaymentId,
      });
    } catch (e) {
      console.error("[razorpay-webhook] record_referral_earning failed:", e);
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed: !result.added,
      creditsAdded: result.credits_added ?? 0,
      totalCredits: result.new_balance ?? 0,
    });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: error?.message || "Webhook processing failed." },
      { status: 500 },
    );
  }
}
