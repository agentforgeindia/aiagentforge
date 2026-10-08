// ============================================================
// Credit plans — the one list of what is sold
// ============================================================
// Plans are ONE-TIME credit packs: pay once, credits never expire,
// no auto-renewal (decision 2026-10-08). Empire is a finite
// 36,000-credit pack, not unlimited.
//
// This file has no server-only imports, so pages, admin screens
// and the AI reply prompts can all read the same numbers.
// lib/razorpayPlans.ts re-exports PLAN_CONFIG for the payment
// routes. To change a plan's price or credits: change it HERE.
// ============================================================

import { PRICE_TABLE } from "@/lib/creditPricing";

export type PlanConfig = { amount: number; credits: number };

export const PLAN_CONFIG: Record<string, PlanConfig> = {
  Starter: { amount: 1999, credits: 1800 },
  "Pro Creator": { amount: 9999, credits: 9000 },
  Empire: { amount: 39999, credits: 36000 },
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const num = (n: number) => n.toLocaleString("en-IN");

/** The lowest plan price, e.g. "₹1,999". */
export const LOWEST_PLAN_PRICE = inr(Math.min(...Object.values(PLAN_CONFIG).map((p) => p.amount)));

/**
 * One paragraph of plan facts for the AI reply prompts (WhatsApp
 * replies, caller script, team assistant) — so they can never quote
 * a plan that is not on the pricing page.
 */
export function planFactsLine(): string {
  const plans = Object.entries(PLAN_CONFIG)
    .map(([name, p]) => `${name} ${inr(p.amount)} (${num(p.credits)} credits)`)
    .join(", ");
  return (
    `Plans: ${plans}. Each plan is a one-time purchase — no monthly fee, no auto-renewal, ` +
    `and credits never expire. ${PRICE_TABLE.premium} credits = 1 Premium image, ` +
    `${PRICE_TABLE.ultra} credits = 1 Ultra HD image. No plan has unlimited generations.`
  );
}
