// GET /api/team/stats?team_id=xxx
//
// Owner/Admin → per-member usage breakdown (kitne credits kisne use kiye)
// Member      → sirf apni usage + personal balance

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getTeamMembership } from "@/lib/teamAuth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(req: NextRequest) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  const teamId = req.nextUrl.searchParams.get("team_id");
  if (!teamId) return NextResponse.json({ error: "team_id is required." }, { status: 400 });

  const membership = await getTeamMembership(user.id, teamId);
  if (!membership) return NextResponse.json({ error: "Team not found or access denied." }, { status: 403 });

  const db = admin();
  const isOwnerOrAdmin = ["owner", "admin"].includes(membership.role);

  if (isOwnerOrAdmin) {
    // ── Owner/Admin view: per-member usage from team_credit_transactions ──

    // All deduction transactions for this team (delta < 0 = credits used)
    const { data: txns, error: txErr } = await db
      .from("team_credit_transactions")
      .select("actor_user_id, delta, created_at")
      .eq("team_id", teamId)
      .lt("delta", 0);

    if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });

    // Aggregate per member
    const usageMap: Record<string, { credits_used: number; last_used: string | null }> = {};
    for (const t of txns ?? []) {
      const uid = t.actor_user_id;
      if (!uid) continue;
      if (!usageMap[uid]) usageMap[uid] = { credits_used: 0, last_used: null };
      usageMap[uid].credits_used += Math.abs(t.delta);
      if (!usageMap[uid].last_used || t.created_at > usageMap[uid].last_used!) {
        usageMap[uid].last_used = t.created_at;
      }
    }

    // Fetch all members + their profiles
    const { data: members } = await db
      .from("team_members")
      .select("user_id, role, joined_at")
      .eq("team_id", teamId);

    const userIds = (members ?? []).map((m: any) => m.user_id);
    const { data: profiles } = await db
      .from("profiles")
      .select("id, email, full_name, credits, plan")
      .in("id", userIds);

    const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

    const memberStats = (members ?? []).map((m: any) => ({
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      email: profileMap[m.user_id]?.email ?? null,
      full_name: profileMap[m.user_id]?.full_name ?? null,
      personal_credits: profileMap[m.user_id]?.credits ?? 0,
      personal_plan: profileMap[m.user_id]?.plan ?? "free",
      team_credits_used: usageMap[m.user_id]?.credits_used ?? 0,
      last_used_at: usageMap[m.user_id]?.last_used ?? null,
    }));

    return NextResponse.json({
      role: membership.role,
      team_credits: membership.credits,
      member_stats: memberStats,
    });
  }

  // ── Member view: own usage from team + personal balance ──

  // Personal balance
  const { data: profile } = await db
    .from("profiles")
    .select("credits, plan, plan_expires_at, plan_purchased_at")
    .eq("id", user.id)
    .maybeSingle();

  // Own team credit usage (sum of debits where actor = me)
  const { data: myTxns } = await db
    .from("team_credit_transactions")
    .select("delta, reason, created_at, generation_id")
    .eq("team_id", teamId)
    .eq("actor_user_id", user.id)
    .lt("delta", 0)
    .order("created_at", { ascending: false })
    .limit(50);

  const totalUsed = (myTxns ?? []).reduce((sum: number, t: any) => sum + Math.abs(t.delta), 0);

  return NextResponse.json({
    role: membership.role,
    team_credits: membership.credits,
    team_credits_used_by_me: totalUsed,
    personal_credits: profile?.credits ?? 0,
    personal_plan: profile?.plan ?? "free",
    plan_expires_at: profile?.plan_expires_at ?? null,
    recent_team_usage: myTxns ?? [],
  });
}
