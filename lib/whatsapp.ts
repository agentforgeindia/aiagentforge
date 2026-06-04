// ============================================================
// AgentForge — WhatsApp Cloud API helper
// ============================================================
// Sends text messages via Meta's WhatsApp Business Cloud API.
//
// Env vars (server-side only):
//   WHATSAPP_PHONE_NUMBER_ID   from Meta → WhatsApp → API Setup
//   WHATSAPP_ACCESS_TOKEN      permanent token for that number
//   WHATSAPP_VERIFY_TOKEN      a random string YOU pick (webhook)
//   WHATSAPP_APP_SECRET        Meta app secret (signature verify)
//   WHATSAPP_AUTO_REPLY        "true" to auto-send AI replies
//                              (default: false → draft only / dry-run)
// ============================================================

export function whatsappAutoReplyEnabled(): boolean {
  const v = (process.env.WHATSAPP_AUTO_REPLY ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

export type WaSendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendWhatsAppText(to: string, body: string): Promise<WaSendResult> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  if (!phoneId || !token) {
    return { ok: false, error: "WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN missing" };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: body.slice(0, 4000) },
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error?.message ?? `WhatsApp HTTP ${res.status}` };
    }
    const id = json?.messages?.[0]?.id ?? "";
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "WhatsApp send failed" };
  }
}
