// ============================================================
// Refer & Earn — browser side.
// ============================================================
// A referral code waits in localStorage (REF_STORAGE_KEY) from the
// moment the friend opens a referral link or types the code on the
// app sign-up screen, until they are logged in. claimPendingReferral()
// then hands it to /api/referral/claim, which gives the credits.
//
// Called from: app/signup/page.tsx, app/auth/callback/page.tsx and
// (inside the Android app) app/login/page.tsx.
// ============================================================

import { supabase } from "@/lib/supabase";
import { REF_STORAGE_KEY, REWARD_RULES } from "@/lib/referral";

export function readPendingReferralCode(): string | null {
  try {
    const code = window.localStorage.getItem(REF_STORAGE_KEY);
    return code && code.trim() ? code.trim() : null;
  } catch {
    return null;
  }
}

export function savePendingReferralCode(code: string | null): void {
  try {
    if (code) window.localStorage.setItem(REF_STORAGE_KEY, code);
    else window.localStorage.removeItem(REF_STORAGE_KEY);
  } catch {
    /* storage blocked — the code simply is not kept */
  }
}

export type ReferralClaim =
  /** Nothing was waiting. */
  | { status: "none" }
  /** Credits were given to both people. */
  | { status: "applied"; code: string; bonus: number }
  /** This account already has a referrer — nothing changes. */
  | { status: "already"; code: string }
  /** No account owns this code. Attribution is still saved. */
  | { status: "invalid"; code: string }
  /** Not logged in yet / no internet — the code is kept for the next try. */
  | { status: "waiting"; code: string };

/** A line in the person's own notification bell. Best effort. */
async function tellUser(userId: string, title: string, body: string, link: string) {
  try {
    await supabase.rpc("add_user_notification", { p_user_id: userId, p_title: title, p_body: body, p_link: link });
    window.dispatchEvent(new Event("af-notifications-refresh"));
  } catch {
    /* the bell is a nicety, never a blocker */
  }
}

/**
 * Gives the referral credits for the code that is waiting, if any.
 * Safe to call more than once: the database rewards an account only
 * once. Never throws.
 */
export async function claimPendingReferral(): Promise<ReferralClaim> {
  const code = readPendingReferralCode();
  if (!code) return { status: "none" };

  try {
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    if (!userId) return { status: "waiting", code };

    // The credits are given by the server (/api/referral/claim) for the
    // verified login — the browser cannot run the database function itself.
    const jwt = sess.session?.access_token;
    const res = await fetch("/api/referral/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ code }),
    });
    // 401 / 409 / 429 / 5xx — keep the code and try again on the next login.
    if (!res.ok) return { status: "waiting", code };

    const result = (await res.json().catch(() => ({}))) as { status?: string; bonus?: number };

    if (result.status === "applied") {
      savePendingReferralCode(null);
      const bonus = Number(result.bonus) || REWARD_RULES.friend;
      await tellUser(
        userId,
        `Referral bonus added: ${bonus} credits`,
        `Your friend's code ${code.toUpperCase()} was applied. The credits are in your balance.`,
        "/billing",
      );
      return { status: "applied", code, bonus };
    }

    savePendingReferralCode(null);
    if (result.status === "already") return { status: "already", code };

    // The code matched no customer account (for example a creator's
    // code that is not linked to a profile yet). The server has kept the
    // attribution on the profile so the team can still see where this
    // sign-up came from — credits are not given.
    await tellUser(
      userId,
      "Referral code not matched",
      `We could not match the code ${code.toUpperCase()}, so no bonus credits were added. If the code is right, message support.`,
      "/support",
    );
    return { status: "invalid", code };
  } catch {
    return { status: "waiting", code };
  }
}
