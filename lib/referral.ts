// ============================================================
// Refer & Earn — shared rules and code helpers (no browser/server
// dependencies, so both sides can import it).
// ============================================================
// How a referral works:
//   • Every profile has a referral_code (profiles.referral_code).
//   • A friend arrives with it either through the link
//     https://aiagentforge.in/?ref=CODE (website — UtmCapture saves
//     it) or by typing it on the sign-up screen in the Android app
//     (app/components/ReferralCodeField.tsx).
//   • After sign-up, lib/referralClient.ts calls /api/referral/claim,
//     which gives the credits (once per account) and writes a row in
//     public.referrals.
//   • The team sees all of it in Admin → Customers → Refer & Rewards.
// ============================================================

/**
 * Credits given by each reward — the single source of truth, used by
 * /api/referral/claim, /api/feedback/submit and the labels in the app
 * and the admin panel.
 */
export const REWARD_RULES = {
  /** To the person whose code was used. */
  referrer: 50,
  /** To the friend who signed up with the code. */
  friend: 25,
  /** For rating a result (once per completed generation). */
  rating: 1,
  /** Extra for writing feedback with the rating. 0 = no extra credit. */
  feedback: 0,
} as const;

/** credit_transactions.reason values written by the rewards. */
export const REWARD_REASONS = {
  referrer: "referral_reward",
  friend: "referral_signup_bonus",
  feedback: "feedback_reward",
} as const;

/** Browser storage key holding a code that is waiting for sign-up. */
export const REF_STORAGE_KEY = "af_ref_code";

/**
 * Cleans what a person typed or pasted.
 *   " bfe6 06a5 "                         → "BFE606A5"
 *   "https://aiagentforge.in/?ref=bfe606a5" → "BFE606A5"
 */
export function normalizeReferralCode(raw: unknown): string {
  let value = String(raw ?? "").trim();
  const fromLink = /[?&]ref=([^&#\s]+)/i.exec(value);
  if (fromLink) {
    try {
      value = decodeURIComponent(fromLink[1]);
    } catch {
      value = fromLink[1];
    }
  }
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/** Could this be a referral code at all? (letters and digits, 4–24) */
export function isReferralCodeShape(code: string): boolean {
  return /^[A-Z0-9]{4,24}$/.test(code);
}
