// ============================================================
// POST /api/referral/claim      Body: { code }
// ============================================================
// Gives the Refer & Earn credits for a referral code, once, to the
// signed-in account.
//
// Why a server route: the browser used to call the database
// function process_referral() directly, but that function may only
// be run by the server (service role) — so the call was refused and
// nobody received referral credits. The rules are the same as that
// function's, applied here with the verified user:
//   • the account must not have a referrer yet (set once, atomically);
//   • you cannot use your own code;
//   • referrer +50, friend +25 (REWARD_RULES in lib/referral.ts),
//     through refund_credits() so both land in the credit ledger;
//   • one row in public.referrals per referred account — the unique
//     index on referred_id is the "only once" guarantee.
//   • a code that matches no customer account (for example a
//     creator's code) is still saved on the profile as attribution,
//     without credits.
//
// Reply: { status: "applied" | "already" | "invalid", bonus? }
// ============================================================

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/serverAuth";
import { refundCredits, serviceDb } from "@/lib/creditsServer";
import { rateLimit } from "@/lib/rateLimit";
import {
  REWARD_REASONS,
  REWARD_RULES,
  isReferralCodeShape,
  normalizeReferralCode,
} from "@/lib/referral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  const limited = rateLimit(req, { name: "referral-claim", limit: 10, windowMs: 10 * 60_000, userId: user.id });
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const code = normalizeReferralCode(body?.code);
  if (!isReferralCodeShape(code)) {
    return NextResponse.json({ status: "invalid" });
  }

  const db = serviceDb();

  const { data: me, error: meErr } = await db
    .from("profiles")
    .select("id, referred_by, referral_code")
    .eq("id", user.id)
    .maybeSingle();
  if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 });
  // The profile row is created right after sign-up; if it is not there
  // yet the page simply tries again on the next login.
  if (!me) return NextResponse.json({ error: "Profile not ready yet." }, { status: 409 });
  if (me.referred_by) return NextResponse.json({ status: "already" });

  // Who owns the code? (Never yourself.)
  const { data: owners } = await db
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .neq("id", user.id)
    .limit(1);
  const referrerId = owners?.[0]?.id as string | undefined;

  // Set the referrer ONCE. Only one request can win this update, so two
  // tabs (or a replayed call) can never both go on to pay the reward.
  const { data: claimed, error: claimErr } = await db
    .from("profiles")
    .update({ referred_by: code })
    .eq("id", user.id)
    .is("referred_by", null)
    .select("id");
  if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 });
  if (!claimed || claimed.length === 0) return NextResponse.json({ status: "already" });

  if (!referrerId) {
    // Attribution saved, no credits (the code belongs to no customer account).
    return NextResponse.json({ status: "invalid" });
  }

  // The referrals row is the second guard: unique on referred_id.
  const { data: recorded, error: refErr } = await db
    .from("referrals")
    .upsert(
      { referrer_id: referrerId, referred_id: user.id, credits_awarded: REWARD_RULES.referrer },
      { onConflict: "referred_id", ignoreDuplicates: true },
    )
    .select("id");
  if (refErr) return NextResponse.json({ error: refErr.message }, { status: 500 });
  if (!recorded || recorded.length === 0) return NextResponse.json({ status: "already" });

  const [toReferrer, toFriend] = await Promise.all([
    refundCredits(referrerId, REWARD_RULES.referrer, REWARD_REASONS.referrer),
    refundCredits(user.id, REWARD_RULES.friend, REWARD_REASONS.friend),
  ]);
  if (!toReferrer.ok || !toFriend.ok) {
    console.error("[referral/claim] reward failed", {
      referrer: toReferrer.message,
      friend: toFriend.message,
    });
  }

  // Running total shown on the referrer's Rewards page (best effort).
  if (toReferrer.ok) {
    const { data: ref } = await db
      .from("profiles")
      .select("referral_credits_earned")
      .eq("id", referrerId)
      .maybeSingle();
    await db
      .from("profiles")
      .update({
        referral_credits_earned: Number(ref?.referral_credits_earned ?? 0) + REWARD_RULES.referrer,
      })
      .eq("id", referrerId);
  }

  return NextResponse.json({
    status: "applied",
    bonus: toFriend.ok ? REWARD_RULES.friend : 0,
    new_balance: toFriend.ok ? toFriend.newBalance : undefined,
  });
}
