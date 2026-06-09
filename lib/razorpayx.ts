// ============================================================
// RazorpayX Payouts helper — automatic influencer payouts via UPI.
// ============================================================
// Uses the same Razorpay API keys (KEY_ID / KEY_SECRET) but requires
// RazorpayX to be activated on the account, plus the source account
// number (RAZORPAYX_ACCOUNT_NUMBER) from the RazorpayX dashboard.
//
// Env vars required for auto-payout:
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET
//   RAZORPAYX_ACCOUNT_NUMBER   (e.g. 2323230000000000)
//
// If RAZORPAYX_ACCOUNT_NUMBER is missing, isRazorpayXConfigured() returns
// false and the caller falls back to manual settlement.
// ============================================================

const BASE = "https://api.razorpay.com/v1";

export function isRazorpayXConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAYX_ACCOUNT_NUMBER
  );
}

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID!;
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function rxFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.description || json?.error?.reason || `RazorpayX ${path} failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

export type PayoutResult = {
  payout_id: string;
  contact_id: string;
  fund_account_id: string;
  status: string;   // queued | pending | processing | processed | reversed | cancelled
  mode: string;
};

// Validate a UPI VPA looks sane (e.g. name@bank). Razorpay rejects bad ones,
// but a quick guard avoids needless API calls.
export function isValidUpi(upi: string): boolean {
  return /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim());
}

// Full flow: contact → fund account (UPI) → payout.
export async function createUpiPayout(opts: {
  name: string;
  email?: string | null;
  phone?: string | null;
  upi: string;
  amountRupees: number;
  referenceId: string;     // our withdrawal id — also used for idempotency
  narration?: string;
}): Promise<PayoutResult> {
  if (!isRazorpayXConfigured()) {
    throw new Error("RazorpayX is not configured (missing RAZORPAYX_ACCOUNT_NUMBER).");
  }
  const upi = opts.upi.trim();
  if (!isValidUpi(upi)) {
    throw new Error("Invalid UPI ID. Use the format name@bank.");
  }

  // 1. Contact
  const contact = await rxFetch("/contacts", {
    name: opts.name,
    email: opts.email || undefined,
    contact: opts.phone || undefined,
    type: "vendor",
    reference_id: `inf_${opts.referenceId}`.slice(0, 40),
  });

  // 2. Fund account (UPI / VPA)
  const fundAccount = await rxFetch("/fund_accounts", {
    contact_id: contact.id,
    account_type: "vpa",
    vpa: { address: upi },
  });

  // 3. Payout (amount in paise)
  const payout = await rxFetch("/payouts", {
    account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
    fund_account_id: fundAccount.id,
    amount: Math.round(opts.amountRupees * 100),
    currency: "INR",
    mode: "UPI",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: opts.referenceId.slice(0, 40),
    narration: (opts.narration || "AgentForge influencer payout").slice(0, 30),
  });

  return {
    payout_id: payout.id,
    contact_id: contact.id,
    fund_account_id: fundAccount.id,
    status: payout.status,
    mode: "UPI",
  };
}
