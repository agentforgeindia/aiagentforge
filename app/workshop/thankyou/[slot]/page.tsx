"use client";

import { useParams } from "next/navigation";
import ThankYouContent from "../ThankYouContent";

// Per-day thank-you route: /workshop/thankyou/21-june (or day2, 21june …).
// Point each Razorpay payment link's redirect URL here so the correct
// WhatsApp community always opens — no query param to be lost.
export default function WorkshopThankYouSlotPage() {
  const params = useParams<{ slot: string | string[] }>();
  const raw = params?.slot;
  const slot = Array.isArray(raw) ? raw[0] : raw;
  return <ThankYouContent slot={slot} />;
}
