// ============================================================
// How credits are charged, refunded and re-charged — the rules
// shown to customers (pricing page, FAQ, Refund Policy, support)
// ============================================================
// These sentences describe what the code does:
//   • one charge per generation id (deduct_credits / the ledger);
//   • a failed or lost generation is refunded from the ledger by
//     lib/generationRefund.ts (the page asks, or the sweeper does it);
//   • a new Generate press is a new generation id → a new charge.
// If the behaviour changes, change the sentence here in the same
// commit — every page reads this file.
//
// Proposed 2026-10-08; the wording is the founder's to approve.
// ============================================================

import { BRANDING_ITEMS, PRICE_TABLE, creditsLabel } from "@/lib/creditPricing";

export type PriceRow = { item: string; credits: string; note?: string };

/** The per-image price table, as rows for a page to render. */
export const PRICE_ROWS: PriceRow[] = [
  { item: "Premium image", credits: `${PRICE_TABLE.premium} credits`, note: "Square / 1080px" },
  { item: "Ultra HD image", credits: `${PRICE_TABLE.ultra} credits`, note: "Square / 1080px" },
  {
    item: "Mobile size 1080×1920",
    credits: creditsLabel(PRICE_TABLE.mobileExtra),
    note: `Premium ${PRICE_TABLE.premium + PRICE_TABLE.mobileExtra} · Ultra HD ${PRICE_TABLE.ultra + PRICE_TABLE.mobileExtra}`,
  },
  { item: "Your own scene / backdrop photo", credits: creditsLabel(PRICE_TABLE.ownScene) },
  { item: "Your own model / person photo", credits: creditsLabel(PRICE_TABLE.ownModel) },
  {
    item: "Branding on the image",
    credits: `${creditsLabel(PRICE_TABLE.brandingItem)} each`,
    note: `${BRANDING_ITEMS.jewellery.join(", ")} — included free on the Empire plan`,
  },
];

export type ChargeRule = { title: string; body: string };

export const CHARGE_RULES: ChargeRule[] = [
  {
    title: "One image, one charge",
    body: "Credits are taken once, when you press Generate, for the options you chose. The number on the Generate button is the number charged.",
  },
  {
    title: "Failed images are refunded automatically",
    body: "If an image fails or never arrives because of a technical problem on our side or the AI provider's, its credits go back to your balance automatically — usually within minutes, at most within about an hour. You do not have to ask.",
  },
  {
    title: "Automatic retries are not charged",
    body: "If our system has to retry the same image in the background, it is still one charge.",
  },
  {
    title: "Trying again after a failure",
    body: "Pressing Generate again starts a new image at the normal price. The failed one has already been refunded, so you pay once.",
  },
  {
    title: "Regenerating and new variations",
    body: "Every new image or variation is a new generation at the normal price for the options you choose, even for the same product. No plan includes free or unlimited regenerations.",
  },
  {
    title: "Completed images",
    body: "Credits for a completed image are not returned because the style differs from what you expected. If a completed image is clearly faulty (blank or corrupted), write to support with the image and we will review it under the Refund Policy.",
  },
];

/** Short single-sentence versions for FAQ answers and support replies. */
export const FAILED_RULE_SHORT =
  "Credits for a failed image return to your balance automatically — usually within minutes, at most within about an hour.";
export const REGENERATION_RULE_SHORT =
  "You can generate again at any time; every new image or variation uses credits at the normal price, and no plan includes free or unlimited regenerations.";
