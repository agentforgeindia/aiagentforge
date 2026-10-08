// ============================================================
// Mobile number — when we ask for it (product rule 2026-10-08)
// ============================================================
//   1. Given at sign-up → nothing more to do.
//   2. Never needed to make images. Nothing asks for it before or
//      at Generate.
//   3. OPTIONAL: after the customer's first successful image a
//      small popup offers to save it ("Later" closes it; it is not
//      shown again in that browser session).
//   4. REQUIRED only where billing or a service needs it — buying
//      a plan (it goes on the invoice and the payment record) and
//      the forms that have their own phone field (meeting booking,
//      demo / on-site requests). Those callers use
//      `ensurePhone(userId, "billing" | "service")`.
//
// The popup is app/components/PhonePromptPopup.tsx (mounted once in
// LayoutClient). Do NOT call ensurePhone from a Generate handler.
// ============================================================

import { supabase } from "@/lib/supabase";

/** Pause after a finished image before the optional popup appears,
 *  so it never covers the result the customer is looking at. */
export const PHONE_AFTER_IMAGE_DELAY_MS = 8_000;

export const PHONE_REQUIRED_EVENT = "af:phone-required";

/** Why the number is required — decides the popup's wording. */
export type PhoneReason = "billing" | "service";

type ProfileLike = { phone?: unknown; billing_phone?: unknown } | null | undefined;

/** Ten digits starting 6-9, after dropping +91 / spaces / dashes. */
export function cleanIndianMobile(value: unknown): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

/** True when the profile already carries a usable mobile number. */
export function profileHasPhone(profile: ProfileLike): boolean {
  if (!profile) return false;
  return Boolean(cleanIndianMobile(profile.phone) || cleanIndianMobile(profile.billing_phone));
}

/** True when this customer already has at least one finished image. */
export async function hasCompletedImage(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .limit(1);
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

let waiting: Array<(ok: boolean) => void> = [];

/** Called by the popup when the number was saved (true) or the popup was closed (false). */
export function settlePhoneRequest(ok: boolean): void {
  const callbacks = waiting;
  waiting = [];
  for (const done of callbacks) done(ok);
}

/**
 * Make sure the signed-in user has a mobile number before a step that
 * really needs one (billing, a service request) — never before a
 * generation. Resolves true when a number is on file (already, or just
 * saved in the popup) and false when the user closed the popup.
 * If the check itself fails (offline, etc.) it does not block the user.
 */
export async function ensurePhone(
  userId: string | null | undefined,
  reason: PhoneReason = "billing",
): Promise<boolean> {
  if (!userId || typeof window === "undefined") return true;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("phone, billing_phone")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return true;
    if (profileHasPhone(data)) return true;
  } catch {
    return true;
  }
  return new Promise<boolean>((resolve) => {
    waiting.push(resolve);
    window.dispatchEvent(new CustomEvent(PHONE_REQUIRED_EVENT, { detail: { reason } }));
  });
}
