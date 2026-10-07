// ============================================================
// Credit plans + server-side Razorpay order verification
// ============================================================
// Single source of truth for the credit plans sold through
// Razorpay. Used by:
//   • /api/razorpay/create-order
//   • /api/razorpay/verify-payment
//   • /api/razorpay/webhook
//
// SECURITY: the browser must never decide which plan a payment
// pays for. A Razorpay checkout signature only proves that a
// payment belongs to an order — it says nothing about the amount.
// `verifyPlanOrder` therefore reads the ORDER (created by our
// server, with server-set notes) back from Razorpay and checks
// that its amount really is the plan's price before any credits
// are added.
// ============================================================

import { createHmac, timingSafeEqual } from "node:crypto";

export type PlanConfig = { amount: number; credits: number };

export const PLAN_CONFIG: Record<string, PlanConfig> = {
  Starter: { amount: 1999, credits: 1800 },
  "Pro Creator": { amount: 9999, credits: 9000 },
  Empire: { amount: 39999, credits: 36000 },
};

export type VerifiedPlanPurchase = {
  userId: string;
  planName: string;
  plan: PlanConfig;
};

type RazorpayRecord = Record<string, unknown>;
type RazorpayEntity = RazorpayRecord | null | undefined;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function razorpayAuthHeader(): string | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function razorpayGet(path: string): Promise<RazorpayRecord | null> {
  const auth = razorpayAuthHeader();
  if (!auth) return null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/${path}`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as RazorpayRecord;
  } catch {
    return null;
  }
}

/** Fetch an order straight from Razorpay (never trust the client's copy). */
export function fetchRazorpayOrder(orderId: string) {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) return Promise.resolve(null);
  return razorpayGet(`orders/${orderId}`);
}

/** Fetch a payment straight from Razorpay. */
export function fetchRazorpayPayment(paymentId: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) return Promise.resolve(null);
  return razorpayGet(`payments/${paymentId}`);
}

/**
 * Decide whether `order` + `payment` are a genuine credit-plan purchase.
 *
 * Returns the buyer + plan taken from the ORDER's server-set notes, or
 * null when anything does not line up:
 *   • the order was not created by /api/razorpay/create-order
 *     (no userId / planName notes — e.g. a ₹99 meeting or workshop order),
 *   • the order amount is not exactly the plan price,
 *   • the payment belongs to a different order, has a different amount,
 *     or has not been authorised/captured.
 */
export function verifyPlanOrder(
  order: RazorpayEntity,
  payment: RazorpayEntity,
): VerifiedPlanPurchase | null {
  if (!order || !payment) return null;

  const notes = (order.notes ?? {}) as Record<string, unknown>;
  const userId = notes.userId;
  const planName = typeof notes.planName === "string" ? notes.planName : "";
  if (!isUuid(userId)) return null;

  const plan = Object.prototype.hasOwnProperty.call(PLAN_CONFIG, planName)
    ? PLAN_CONFIG[planName]
    : null;
  if (!plan) return null;

  const expectedPaise = plan.amount * 100;
  if (Number(order.amount) !== expectedPaise) return null;
  if (String(order.currency ?? "INR").toUpperCase() !== "INR") return null;

  if (!payment.order_id || payment.order_id !== order.id) return null;
  if (Number(payment.amount) !== expectedPaise) return null;

  const status = String(payment.status ?? "");
  if (status !== "captured" && status !== "authorized") return null;

  return { userId, planName, plan };
}

/**
 * Same idea for the small fixed-price orders (₹99 meeting, workshop…):
 * the ORDER must have been created by our server for this purpose
 * (`notes.type`), for exactly this price, and the payment must belong
 * to it and be authorised/captured. Returns the order's notes, or null.
 * A checkout signature alone only proves that a payment belongs to an
 * order — not what the order was for or how much it was.
 */
export function verifyFixedPriceOrder(
  order: RazorpayEntity,
  payment: RazorpayEntity,
  expected: { type: string; amountRupees: number },
): Record<string, unknown> | null {
  if (!order || !payment) return null;
  const notes = (order.notes ?? {}) as Record<string, unknown>;
  if (notes.type !== expected.type) return null;

  const expectedPaise = Math.round(expected.amountRupees * 100);
  if (Number(order.amount) !== expectedPaise) return null;
  if (String(order.currency ?? "INR").toUpperCase() !== "INR") return null;

  if (!payment.order_id || payment.order_id !== order.id) return null;
  if (Number(payment.amount) !== expectedPaise) return null;

  const status = String(payment.status ?? "");
  if (status !== "captured" && status !== "authorized") return null;

  return notes;
}

/** Constant-time check of a Razorpay checkout signature. */
export function checkoutSignatureValid(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
): boolean {
  const expected = Buffer.from(
    createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex"),
  );
  const given = Buffer.from(String(signature));
  return expected.length === given.length && timingSafeEqual(expected, given);
}
