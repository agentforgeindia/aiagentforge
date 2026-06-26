// POST /api/team/topup
// Owner transfers credits from their personal balance to the team pool.

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getTeamMembership } from "@/lib/teamAuth";
import { topupTeamFromOwner } from "@/lib/creditsServer";

export const runtime = "nodejs";

const MAX_TOPUP = 100_000;

export async function POST(req: NextRequest) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const { team_id, amount } = body ?? {};
  if (!team_id || typeof team_id !== "string") {
    return NextResponse.json({ error: "team_id is required." }, { status: 400 });
  }
  const credits = Number(amount);
  if (!Number.isFinite(credits) || credits <= 0 || credits > MAX_TOPUP) {
    return NextResponse.json({ error: `amount must be a positive integer ≤ ${MAX_TOPUP}.` }, { status: 400 });
  }

  // Only owner can top up
  const membership = await getTeamMembership(user.id, team_id);
  if (!membership) return NextResponse.json({ error: "Team not found or access denied." }, { status: 403 });
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "Only the team owner can add credits." }, { status: 403 });
  }

  const result = await topupTeamFromOwner(team_id, user.id, credits);
  if (!result.ok) {
    if (result.reason === "insufficient") {
      return NextResponse.json({ error: "Not enough credits in your personal balance.", code: "INSUFFICIENT_CREDITS" }, { status: 402 });
    }
    return NextResponse.json({ error: result.message || "Top-up failed." }, { status: 500 });
  }

  return NextResponse.json({ success: true, team_balance: result.newBalance });
}
