// POST /api/careers/influencer/withdraw-earnings
// A creator asks for their available balance to be paid to a UPI ID.
//
// Rules:
//   • Only the signed-in creator can ask (lib/influencerSession.ts).
//   • This route does not send money. It records the request; the
//     payout happens when a team member approves it in
//     Admin → Influencer Withdrawals (affiliates.manage permission).
//
// The amount is worked out in the database
// (request_influencer_withdrawal) — never taken from the browser.

import { NextResponse } from "next/server";

import { serviceDb } from "@/lib/creditsServer";
import { isValidUpi } from "@/lib/razorpayx";
import { rateLimit } from "@/lib/rateLimit";
import { authorizeInfluencer, influencerDenied } from "@/lib/influencerSession";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "influencer-withdraw", limit: 6, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    const { cid, upi } = await req.json();

    if (!cid) {
      return NextResponse.json({ ok: false, error: "Missing dashboard id." }, { status: 400 });
    }
    if ((await authorizeInfluencer(req, cid)) !== "self") return influencerDenied();

    if (!upi || !isValidUpi(String(upi))) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid UPI ID (e.g. yourname@okhdfc)." },
        { status: 400 }
      );
    }

    // Validates the balance and records the request atomically.
    const { data, error } = await serviceDb().rpc("request_influencer_withdrawal", {
      p_cid: cid,
      p_upi: String(upi).trim(),
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const res = (data ?? {}) as { ok?: boolean; error?: string; amount?: number; withdrawal_id?: string };
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error ?? "Could not request withdrawal." }, { status: 400 });
    }

    const amount = res.amount ?? 0;
    return NextResponse.json({
      ok: true,
      amount,
      auto: false,
      message: `Withdrawal of ₹${amount.toLocaleString("en-IN")} requested! Our team reviews every request and transfers it to your UPI within 24 hours.`,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Network error." }, { status: 500 });
  }
}
