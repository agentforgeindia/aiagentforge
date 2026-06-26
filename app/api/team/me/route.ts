// GET /api/team/me
// Returns all teams the authenticated user belongs to.

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getUserTeams } from "@/lib/teamAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  const teams = await getUserTeams(user.id);
  return NextResponse.json({ teams });
}
