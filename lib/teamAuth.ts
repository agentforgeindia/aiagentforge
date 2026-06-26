// ============================================================
// AgentForge Team Auth helpers
// Server-side only — uses service role key.
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedAdmin: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase service-role env vars missing.");
  cachedAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}

export type TeamRole = "owner" | "admin" | "member";

export type TeamInfo = {
  id: string;
  name: string;
  credits: number;
  plan: string;
  plan_expires_at: string | null;
  role: TeamRole;
};

/**
 * Verify that `userId` is an active member of `teamId`.
 * Returns team info + the member's role, or null if not a member.
 */
export async function getTeamMembership(
  userId: string,
  teamId: string,
): Promise<TeamInfo | null> {
  const { data: member, error: memberErr } = await admin()
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberErr || !member) return null;

  const { data: team, error: teamErr } = await admin()
    .from("teams")
    .select("id, name, credits, plan, plan_expires_at")
    .eq("id", teamId)
    .maybeSingle();

  if (teamErr || !team) return null;

  return {
    id: team.id,
    name: team.name,
    credits: Number(team.credits ?? 0),
    plan: team.plan ?? "free",
    plan_expires_at: team.plan_expires_at ?? null,
    role: member.role as TeamRole,
  };
}

/**
 * Returns true if the team's plan allows bulk generation.
 */
export function teamHasBulkAccess(plan: string): boolean {
  const p = plan.toLowerCase();
  return (
    p.includes("empire") ||
    p.includes("founder") ||
    p.includes("unlimited") ||
    p.includes("pro") ||
    p.includes("creator")
  );
}

/**
 * Fetch all teams for a user (returns basic info for each).
 */
export async function getUserTeams(userId: string): Promise<TeamInfo[]> {
  const { data, error } = await admin()
    .from("team_members")
    .select("role, teams(id, name, credits, plan, plan_expires_at)")
    .eq("user_id", userId);

  if (error || !data) return [];

  return data
    .filter((row: any) => row.teams)
    .map((row: any) => ({
      id: row.teams.id,
      name: row.teams.name,
      credits: Number(row.teams.credits ?? 0),
      plan: row.teams.plan ?? "free",
      plan_expires_at: row.teams.plan_expires_at ?? null,
      role: row.role as TeamRole,
    }));
}
