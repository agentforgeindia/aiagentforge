// ============================================================
// Meta Conversions API (server-side events)
// ============================================================
// Sends CRM conversion events (Purchase, Lead, …) straight to Meta so
// ad optimisation + attribution survive cookie/iOS loss and Meta can
// optimise for the leads that actually convert.
//
// Env:
//   NEXT_PUBLIC_META_PIXEL_ID  — the Pixel / Dataset id (already set)
//   META_CAPI_TOKEN            — Conversions API access token
//                               (Events Manager → Settings → generate)
// No token configured → every call is a safe no-op.
// ============================================================

import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const CAPI_TOKEN = process.env.META_CAPI_TOKEN || "";
const GRAPH = "https://graph.facebook.com/v21.0";

function sha256(value?: string | null): string | undefined {
  if (!value) return undefined;
  const norm = value.trim().toLowerCase();
  if (!norm) return undefined;
  return crypto.createHash("sha256").update(norm).digest("hex");
}

// Meta wants phone as digits only (with country code), then hashed.
function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d]/g, "");
  return digits ? sha256(digits) : undefined;
}

export type MetaEvent = {
  eventName: "Purchase" | "Lead" | "CompleteRegistration" | "Schedule" | string;
  email?: string | null;
  phone?: string | null;
  value?: number;
  currency?: string;
  // event_id must match the browser Pixel event (when one exists) so Meta
  // de-duplicates. For server-only events use the payment / lead id.
  eventId?: string;
  actionSource?: "website" | "system_generated" | "crm" | "app";
  eventSourceUrl?: string;
  fbc?: string | null; // _fbc cookie (from fbclid)
  fbp?: string | null; // _fbp cookie
  clientIp?: string | null;
  userAgent?: string | null;
};

export async function sendMetaEvent(e: MetaEvent): Promise<void> {
  if (!CAPI_TOKEN || !PIXEL_ID) return; // not configured → no-op

  try {
    const user_data: Record<string, unknown> = {};
    const em = sha256(e.email);
    const ph = hashPhone(e.phone);
    if (em) user_data.em = [em];
    if (ph) user_data.ph = [ph];
    if (e.fbc) user_data.fbc = e.fbc;
    if (e.fbp) user_data.fbp = e.fbp;
    if (e.clientIp) user_data.client_ip_address = e.clientIp;
    if (e.userAgent) user_data.client_user_agent = e.userAgent;

    const custom_data: Record<string, unknown> = {};
    if (typeof e.value === "number") custom_data.value = e.value;
    if (e.currency) custom_data.currency = e.currency;

    const event: Record<string, unknown> = {
      event_name: e.eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: e.actionSource || "system_generated",
      user_data,
    };
    if (e.eventId) event.event_id = e.eventId;
    if (e.eventSourceUrl) event.event_source_url = e.eventSourceUrl;
    if (Object.keys(custom_data).length) event.custom_data = custom_data;

    const res = await fetch(
      `${GRAPH}/${PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [event] }),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[meta-capi] event rejected:", res.status, text.slice(0, 300));
    }
  } catch (err) {
    console.error("[meta-capi] send failed:", err);
  }
}
