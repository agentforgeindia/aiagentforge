import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendMetaEvent } from "@/lib/metaCapi";

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

// Hosted Razorpay Payment Page id → workshop day. This is the most
// reliable signal: the page id shows up in the (full) payment payload,
// so routing no longer depends on per-payment notes propagating.
const PAGE_TO_SLOT: Record<string, string> = {
  pl_SrCcaEEG4lDJ4U: "20-june", // Day 01
  pl_T0jBVjq7V3m6YC: "21-june", // Day 02
  pl_T0jF2ojwXv8fB8: "27-june", // Day 03
  pl_T0jC2JKtO63npD: "28-june", // Day 04
};

// Returns a valid workshop_slots slot_id, or 'unassigned' as a safe fallback
// (that row is seeded by sql/workshop-payment-page-capture.sql, so the FK and
// the admin list always accept it — the paid customer is never dropped).
function resolveWorkshopSlot(payment: any): string {
  // 1. Payment Page id anywhere in the payload (most reliable).
  let raw = "";
  try {
    raw = JSON.stringify(payment || {});
  } catch {
    raw = "";
  }
  for (const [pid, slot] of Object.entries(PAGE_TO_SLOT)) {
    if (raw.includes(pid)) return slot;
  }
  // 2. An explicit slot value anywhere in the payload (a propagated note,
  //    invoice field, etc.) — "20-june" / "21-june" / ...
  for (const s of WORKSHOP_SLOTS) {
    if (raw.includes(s)) return s;
  }
  // 3. The page title "… Day 0N" ANYWHERE in the full payload — for hosted
  //    Payment Pages this rides in the invoice line-item / description even
  //    when payment.notes is empty. Scan the whole stringified payload.
  const m = raw.match(/day\s*0?([1-4])(?!\d)/i);
  if (m && DAY_TO_SLOT[m[1]]) return DAY_TO_SLOT[m[1]];
  return "unassigned";
}

// Fetch the FULL payment from Razorpay. The webhook payload often carries
// a slimmed-down payment entity (missing notes / page references); the
// full fetch returns them, which is what slot resolution needs.
async function fetchFullPayment(paymentId: string): Promise<any | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !paymentId) return null;
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}?expand[]=invoice`,
      { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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

    // payment.captured covers checkout / Payment Pages / links; QR-code
    // payments also fire qr_code.credited (with the same payment entity).
    const evtName = event?.event;
    if (evtName !== "payment.captured" && evtName !== "qr_code.credited") {
      return NextResponse.json({
        success: true,
        ignored: evtName || "unknown_event",
      });
    }

    const payment = event?.payload?.payment?.entity;
    const razorpayPaymentId = payment?.id;
    const razorpayOrderId = payment?.order_id;
    const userId = payment?.notes?.userId;
    const planName = payment?.notes?.planName;

    // ── External payments (workshop links / Payment Pages / QR codes /
    // WhatsApp-shared links) ────────────────────────────────────────
    // Anything that is NOT a valid in-app credit-plan purchase is an
    // external workshop/QR/link payment that bypassed the app checkout.
    // Record it into workshop_registrations so the paid customer ALWAYS
    // shows in the admin — never silently dropped. Idempotency uses the
    // order id when present, else the payment id (QR-code payments often
    // have no order). The slot is resolved from the page title, falling
    // back to 'unassigned' (admin can set the correct date manually).
    const isCreditPlan = Boolean(
      userId && planName && PLAN_CONFIG[planName as string],
    );
    if (!isCreditPlan) {
      if (!razorpayPaymentId) {
        return NextResponse.json({ error: "No payment id." }, { status: 400 });
      }
      const supabaseAdmin = getSupabaseAdmin();
      // Use the FULL payment (notes + page reference) for slot routing;
      // fall back to the webhook's slim entity if the fetch fails.
      const full = (await fetchFullPayment(razorpayPaymentId)) || payment;
      const slot = resolveWorkshopSlot(full);
      // DEBUG: when a payment can't be auto-slotted, dump the full payment
      // payload to Error Logs so we can see exactly which field carries the
      // workshop day / page reference, then fix routing for good.
      if (slot === "unassigned") {
        try {
          await supabaseAdmin.rpc("log_error", {
            p_category: "payment",
            p_source: "workshop-slot-debug",
            p_message: `Workshop payment not auto-slotted (${razorpayPaymentId})`,
            p_details: { payment: full },
            p_user_id: null,
          });
        } catch {
          /* logging must not block */
        }
      }
      const { error: wkErr } = await supabaseAdmin.rpc(
        "register_workshop_seat",
        {
          p_slot_id: slot,
          p_order_id: razorpayOrderId || razorpayPaymentId,
          p_payment_id: razorpayPaymentId,
          p_amount: full?.amount ? Number(full.amount) / 100 : 99,
          p_name: full?.notes?.name ?? null,
          p_email: full?.email ?? payment?.email ?? null,
          p_phone: full?.contact ?? payment?.contact ?? null,
        },
      );
      if (wkErr) {
        console.error("[razorpay-webhook] register_workshop_seat failed:", wkErr);
        return NextResponse.json(
          { error: wkErr.message || "Could not record payment." },
          { status: 500 },
        );
      }
      // Meta Conversions API — tell Meta this paid conversion happened so
      // it can optimise ads for buyers (no-op until META_CAPI_TOKEN is set).
      await sendMetaEvent({
        eventName: "Purchase",
        email: full?.email ?? payment?.email,
        phone: full?.contact ?? payment?.contact,
        value: full?.amount ? Number(full.amount) / 100 : 99,
        currency: "INR",
        eventId: razorpayPaymentId,
        actionSource: "website",
      });
      return NextResponse.json({ success: true, recorded: true, slot });
    }

    const plan = PLAN_CONFIG[planName];

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

    // Meta Conversions API — plan purchase (no-op until token is set).
    await sendMetaEvent({
      eventName: "Purchase",
      email: payment?.email,
      phone: payment?.contact,
      value: plan.amount,
      currency: "INR",
      eventId: razorpayPaymentId,
      actionSource: "website",
    });

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
