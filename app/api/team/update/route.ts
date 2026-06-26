// PATCH /api/team/update — update team name (owner only)

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

export async function PATCH(req: NextRequest) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const { team_id, name } = body ?? {};
  if (!team_id) return NextResponse.json({ error: "team_id is required." }, { status: 400 });

  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || trimmed.length < 2 || trimmed.length > 80) {
    return NextResponse.json({ error: "Team name must be 2–80 characters." }, { status: 400 });
  }

  const membership = await getTeamMembership(user.id, team_id);
  if (!membership) return NextResponse.json({ error: "Team not found or access denied." }, { status: 403 });
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can edit team details." }, { status: 403 });
  }

  const { error } = await admin()
    .from("teams")
    .update({ name: trimmed })
    .eq("id", team_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, name: trimmed });
}
