// GET  /api/team/members?team_id=xxx  — list members
// DELETE /api/team/members             — remove a member (owner/admin only)

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

  const { data: memberRows, error } = await admin()
    .from("team_members")
    .select("id, user_id, role, joined_at")
    .eq("team_id", teamId)
    .order("joined_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!memberRows?.length) return NextResponse.json({ members: [] });

  // Fetch profiles separately (team_members.user_id → auth.users, not public.profiles FK)
  const userIds = memberRows.map((m: any) => m.user_id);
  const { data: profiles } = await admin()
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

  const members = memberRows.map((m: any) => ({
    ...m,
    profiles: profileMap[m.user_id] ?? null,
  }));

  return NextResponse.json({ members });
}

export async function DELETE(req: NextRequest) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const { team_id, user_id: targetUserId } = body ?? {};
  if (!team_id || !targetUserId) {
    return NextResponse.json({ error: "team_id and user_id are required." }, { status: 400 });
  }

  const membership = await getTeamMembership(user.id, team_id);
  if (!membership) return NextResponse.json({ error: "Team not found or access denied." }, { status: 403 });

  // Only owner can remove admins; owner/admin can remove members; members can remove themselves
  const isSelf = targetUserId === user.id;
  if (!isSelf && !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only team owners/admins can remove members." }, { status: 403 });
  }

  // Prevent owner from removing themselves (would orphan the team)
  const { data: targetMember } = await admin()
    .from("team_members")
    .select("role")
    .eq("team_id", team_id)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (targetMember?.role === "owner") {
    return NextResponse.json({ error: "Owner cannot be removed. Transfer ownership first." }, { status: 400 });
  }

  const { error } = await admin()
    .from("team_members")
    .delete()
    .eq("team_id", team_id)
    .eq("user_id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
