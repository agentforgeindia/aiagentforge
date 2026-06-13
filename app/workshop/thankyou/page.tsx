"use client";

import { useEffect, useState } from "react";
import ThankYouContent from "./ThankYouContent";

// Legacy query-param entry: /workshop/thankyou?slot=21-june
// Preferred is the per-day path route (/workshop/thankyou/21-june), which is
// immune to Razorpay's own appended query params.
export default function WorkshopThankYouPage() {
  const [slot, setSlot] = useState<string | null>(null);

  useEffect(() => {
    setSlot(new URLSearchParams(window.location.search).get("slot"));
  }, []);

  return <ThankYouContent slot={slot} />;
}
