// POST /api/team/join
// Authenticated user accepts an invite by token.

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
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

  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token) return NextResponse.json({ error: "token is required." }, { status: 400 });

  const db = admin();

  // Fetch and validate invite
  const { data: invite, error: inviteErr } = await db
    .from("team_invites")
    .select("id, team_id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteErr || !invite) {
    return NextResponse.json({ error: "Invalid or expired invite link." }, { status: 404 });
  }
  if (invite.accepted_at) {
    return NextResponse.json({ error: "This invite has already been used." }, { status: 409 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite link has expired." }, { status: 410 });
  }
  if (invite.email !== user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: "This invite was sent to a different email address." },
      { status: 403 },
    );
  }

  // Check not already a member
  const { data: existingMember } = await db
    .from("team_members")
    .select("id")
    .eq("team_id", invite.team_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    // Mark invite accepted anyway
    await db.from("team_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
    return NextResponse.json({ error: "You are already a member of this team." }, { status: 409 });
  }

  // Add member
  const { error: memberErr } = await db
    .from("team_members")
    .insert({ team_id: invite.team_id, user_id: user.id, role: invite.role });

  if (memberErr) {
    return NextResponse.json({ error: "Failed to join team." }, { status: 500 });
  }

  // Mark invite accepted
  await db.from("team_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  // Return team info
  const { data: team } = await db
    .from("teams")
    .select("id, name, plan, credits")
    .eq("id", invite.team_id)
    .maybeSingle();

  return NextResponse.json({ success: true, team });
}
