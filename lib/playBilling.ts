// ============================================================
// Google Play Billing — credit packs sold inside the Android app
// ============================================================
// The Android app sells the same three packs as the website, but
// through Google Play (Play Store rule for digital goods). The
// product IDs below must exist in Play Console as one-time,
// consumable in-app products:
//   Play Console → Monetize → Products → In-app products
//
// Prices are set in Play Console and shown from there. `amount`
// is only what gets recorded in the payments table (same list
// price as the website); credits always come from this file,
// never from the app.
//
// Shared by the app screen (AppCredits) and the server route
// (/api/play-billing/verify). No secrets here.
// ============================================================

export type PlayProduct = {
  /** In-app product ID in Play Console. Never rename after creating it there. */
  productId: string;
  /** Plan name — same names as the website plans. */
  plan: "Starter" | "Pro Creator" | "Empire";
  /** Website list price in INR, recorded on the payment row. */
  amount: number;
  credits: number;
  /** One short line shown under the pack name. */
  note: string;
};

export const PLAY_PRODUCTS: PlayProduct[] = [
  {
    productId: "credits_starter_1800",
    plan: "Starter",
    amount: 1999,
    credits: 1800,
    note: "Up to 120 standard images",
  },
  {
    productId: "credits_pro_9000",
    plan: "Pro Creator",
    amount: 9999,
    credits: 9000,
    note: "Up to 600 standard images · bulk generation",
  },
  {
    productId: "credits_empire_36000",
    plan: "Empire",
    amount: 39999,
    credits: 36000,
    note: "Up to 2,400 standard images · bulk studio",
  },
];

export function findPlayProduct(productId: string): PlayProduct | undefined {
  return PLAY_PRODUCTS.find((p) => p.productId === productId);
}

/** Android package name of the app (mobile/capacitor.config.json → appId). */
export const PLAY_PACKAGE_NAME_DEFAULT = "in.aiagentforge.mobile";
