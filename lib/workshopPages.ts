// ============================================================
// Workshop slot → Razorpay payment-page URL + readable label.
// Used by the "Failed payments" admin view to resend the correct
// date's payment link.
// ============================================================

export const SLOT_PAGE_URL: Record<string, string> = {
  "20-june": "https://rzp.io/rzp/QAjgXm7y",
  "21-june": "https://rzp.io/rzp/hvlTIKA",
  "27-june": "https://rzp.io/rzp/kzGRxdwM",
  "28-june": "https://rzp.io/rzp/Ny5B2Flx",
  "1-july": "https://rzp.io/rzp/workshop1-july",
  "5-july": "https://rzp.io/rzp/workshop5-july",
};

export const SLOT_LABEL: Record<string, string> = {
  "20-june": "20 June",
  "21-june": "21 June",
  "27-june": "27 June",
  "28-june": "28 June",
  "1-july": "1 July",
  "5-july": "5 July",
  "4-july": "4 July",
};

// WhatsApp resend message for an incomplete payment.
export function resendWhatsAppLink(phone: string, slot: string): string {
  const clean = String(phone || "").replace(/\D/g, "").replace(/^0+/, "");
  const num = clean.length === 10 ? "91" + clean : clean;
  const url = SLOT_PAGE_URL[slot] || "https://aiagentforge.in/workshop";
  const label = SLOT_LABEL[slot] || "the workshop";
  const msg =
    `Hi! 👋 Your ₹99 payment for the AgentForge TextilePrints → Mockup AI Workshop (${label}) ` +
    `didn't go through. Complete your payment here to confirm your seat 👇\n${url}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}
