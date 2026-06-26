// POST /api/team/invite
// Owner/admin sends an email invite to join the team.

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

export async function POST(req: NextRequest) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const { team_id, email, role = "member" } = body ?? {};

  if (!team_id || typeof team_id !== "string") {
    return NextResponse.json({ error: "team_id is required." }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "role must be 'admin' or 'member'." }, { status: 400 });
  }

  // Only owner/admin can invite
  const membership = await getTeamMembership(user.id, team_id);
  if (!membership) return NextResponse.json({ error: "Team not found or access denied." }, { status: 403 });
  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only team owners/admins can invite members." }, { status: 403 });
  }

  const db = admin();

  // Check if already a member
  const { data: alreadyMember } = await db
    .from("team_members")
    .select("id")
    .eq("team_id", team_id)
    .eq("user_id",
      // Resolve email → user_id via auth.users (admin API)
      (await db.auth.admin.listUsers()).data?.users?.find(
        (u: any) => u.email === email.toLowerCase()
      )?.id ?? "00000000-0000-0000-0000-000000000000"
    )
    .maybeSingle();

  if (alreadyMember) {
    return NextResponse.json({ error: "This user is already a team member." }, { status: 409 });
  }

  // Upsert invite (reset token/expiry if re-inviting)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: invite, error: inviteErr } = await db
    .from("team_invites")
    .insert({
      team_id,
      email: email.toLowerCase(),
      role,
      invited_by: user.id,
      expires_at: expiresAt,
    })
    .select("id, token, email, expires_at")
    .single();

  if (inviteErr || !invite) {
    return NextResponse.json({ error: inviteErr?.message || "Failed to create invite." }, { status: 500 });
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://aiagentforge.in"}/team/join?token=${invite.token}`;

  return NextResponse.json({
    success: true,
    invite: {
      id: invite.id,
      email: invite.email,
      expires_at: invite.expires_at,
      invite_url: inviteUrl,
    },
  });
}
