// POST /api/team/create
// Creates a team with the authenticated user as owner.

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

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Team name must be 2–80 characters." }, { status: 400 });
  }

  const db = admin();

  // One team per user (owner) for now
  const { data: existing } = await db
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You already own a team." }, { status: 409 });
  }

  // Create team
  const { data: team, error: teamErr } = await db
    .from("teams")
    .insert({ name, owner_id: user.id })
    .select("id, name, credits, plan")
    .single();

  if (teamErr || !team) {
    return NextResponse.json({ error: teamErr?.message || "Failed to create team." }, { status: 500 });
  }

  // Add owner as member
  const { error: memberErr } = await db
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id, role: "owner", invited_by: user.id });

  if (memberErr) {
    await db.from("teams").delete().eq("id", team.id);
    return NextResponse.json({ error: "Failed to add owner as member." }, { status: 500 });
  }

  return NextResponse.json({ success: true, team });
}
