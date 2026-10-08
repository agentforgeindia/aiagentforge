// ============================================================
// Mobile number — when we ask for it (decision 2026-10-08)
// ============================================================
//   1. Given at sign-up → nothing more to do.
//   2. Not given → no forced page. After the person has been on the
//      site for 30 seconds a small popup asks for it; it can be
//      closed ("Later").
//   3. Still not given when they press Generate → the same popup
//      opens and the generation starts only after the number is saved.
//
// The popup itself is app/components/PhonePromptPopup.tsx (mounted
// once in LayoutClient). Agent pages call `ensurePhone(userId)` at
// the top of their generate handler:
//
//     if (!(await ensurePhone(user.id))) return;   // user closed the popup
// ============================================================

import { supabase } from "@/lib/supabase";

/** Seconds on the site before the optional popup appears. */
export const PHONE_PROMPT_DELAY_MS = 30_000;

export const PHONE_REQUIRED_EVENT = "af:phone-required";

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

let waiting: Array<(ok: boolean) => void> = [];

/** Called by the popup when the number was saved (true) or the popup was closed (false). */
export function settlePhoneRequest(ok: boolean): void {
  const callbacks = waiting;
  waiting = [];
  for (const done of callbacks) done(ok);
}

/**
 * Make sure the signed-in user has a mobile number before a generation.
 * Resolves true when a number is on file (already, or just saved in the
 * popup) and false when the user closed the popup.
 * If the check itself fails (offline, etc.) it does not block the user.
 */
export async function ensurePhone(userId: string | null | undefined): Promise<boolean> {
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
    window.dispatchEvent(new CustomEvent(PHONE_REQUIRED_EVENT));
  });
}
