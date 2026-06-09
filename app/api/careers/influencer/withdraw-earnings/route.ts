// POST /api/careers/influencer/withdraw-earnings
// Body: { cid: string, upi: string }
// 1. Creates a withdrawal request for the influencer's available balance.
// 2. If RazorpayX is configured, fires an automatic UPI payout right away.
//    Otherwise the request stays 'requested' for manual settlement.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createUpiPayout, isRazorpayXConfigured, isValidUpi } from "@/lib/razorpayx";

export const runtime = "nodejs";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(req: Request) {
  try {
    const { cid, upi } = await req.json();
    if (!cid) {
      return NextResponse.json({ ok: false, error: "Missing dashboard id." }, { status: 400 });
    }
    if (!upi || !isValidUpi(String(upi))) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid UPI ID (e.g. yourname@okhdfc)." },
        { status: 400 }
      );
    }

    // 1. Create the withdrawal request (validates available balance).
    const { data, error } = await db.rpc("request_influencer_withdrawal", {
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

    const withdrawalId = res.withdrawal_id!;
    const amount = res.amount ?? 0;

    // 2. Manual fallback — RazorpayX not set up yet.
    if (!isRazorpayXConfigured()) {
      return NextResponse.json({
        ok: true,
        amount,
        auto: false,
        message:
          "Withdrawal requested! Your payout will be transferred to your UPI within 24 hours.",
      });
    }

    // 3. Fetch creator details for the payout contact.
    const { data: cand } = await db
      .from("candidates")
      .select("name, email, mobile")
      .eq("id", cid)
      .maybeSingle();

    try {
      const payout = await createUpiPayout({
        name: cand?.name ?? "AgentForge Creator",
        email: cand?.email ?? null,
        phone: cand?.mobile ?? null,
        upi: String(upi).trim(),
        amountRupees: amount,
        referenceId: withdrawalId,
        narration: "AgentForge payout",
      });

      const paid = ["processed", "processing", "queued", "pending"].includes(payout.status);
      await db
        .from("influencer_withdrawals")
        .update({
          payout_id: payout.payout_id,
          contact_id: payout.contact_id,
          fund_account_id: payout.fund_account_id,
          payout_mode: payout.mode,
          status: payout.status === "processed" ? "paid" : "processing",
          processed_at: payout.status === "processed" ? new Date().toISOString() : null,
        })
        .eq("id", withdrawalId);

      return NextResponse.json({
        ok: true,
        amount,
        auto: true,
        payout_status: payout.status,
        message:
          payout.status === "processed"
            ? `₹${amount.toLocaleString("en-IN")} transferred to your UPI successfully! 🎉`
            : `Withdrawal of ₹${amount.toLocaleString("en-IN")} initiated! It will reach your UPI within 24 hours.`,
      });
    } catch (payErr: any) {
      // Payout API failed → keep the request, mark failed reason, fall back to manual.
      await db
        .from("influencer_withdrawals")
        .update({
          status: "requested",
          failure_reason: payErr?.message ?? "payout failed",
        })
        .eq("id", withdrawalId);

      return NextResponse.json({
        ok: true,
        amount,
        auto: false,
        message:
          "Withdrawal requested! Auto-transfer hit a snag, so our team will settle it manually within 24 hours.",
      });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Network error." }, { status: 500 });
  }
}
