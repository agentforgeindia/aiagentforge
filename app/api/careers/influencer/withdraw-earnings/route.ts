// POST /api/careers/influencer/withdraw-earnings
// Body: { cid: string, upi?: string }
// Creates a withdrawal request for the influencer's available balance.
// Settlement is processed manually by the team within 24 hours.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const { data, error } = await db.rpc("request_influencer_withdrawal", {
      p_cid: cid,
      p_upi: upi ?? null,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const res = (data ?? {}) as { ok?: boolean; error?: string; amount?: number };
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error ?? "Could not request withdrawal." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      amount: res.amount ?? 0,
      message:
        "Withdrawal requested! Your payout will be transferred within 24 hours to your registered account.",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Network error." }, { status: 500 });
  }
}
