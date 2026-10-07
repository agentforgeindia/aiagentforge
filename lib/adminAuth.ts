// ============================================================
// Server-side admin permission check for /api/admin/* routes.
// ============================================================
// The admin pages hide buttons with useAdminPermissions(), but a
// hidden button is not protection — the route must check too.
//
//   const admin = await requireAdminPermission(req, "content.publish");
//   if (admin instanceof Response) return admin;   // 401 / 403
//   …admin.email, admin.role, admin.db (service-role client)
//
// Same rules as sql/rbac.sql has_permission(): the caller's email
// must be an ACTIVE row in admin_users, and that role's permissions
// must contain the permission, "<prefix>.*" or "*".
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AdminCaller = {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  /** Service-role client — bypasses RLS. Server only. */
  db: SupabaseClient;
};

function json(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function adminHasPermission(perm: string, owned: string[]): boolean {
  if (perm === "any") return true;
  if (owned.includes("*") || owned.includes(perm)) return true;
  return owned.includes(`${perm.split(".")[0]}.*`);
}

/** Escape % and _ so an email is matched literally by ILIKE. */
const likeLiteral = (value: string) => value.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export async function requireAdminPermission(req: Request, perm: string): Promise<AdminCaller | Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json(500, "Server is not configured.");

  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return json(401, "Please sign in again.");

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: auth, error: authError } = await db.auth.getUser(match[1].trim());
  const email = auth?.user?.email?.toLowerCase();
  if (authError || !auth?.user || !email) return json(401, "Please sign in again.");

  const { data: member } = await db
    .from("admin_users")
    .select("email, role, active")
    .ilike("email", likeLiteral(email))
    .limit(1)
    .maybeSingle();
  if (!member || member.active === false || !member.role) return json(403, "You do not have access to the admin panel.");

  const { data: role } = await db.from("admin_roles").select("permissions").eq("id", member.role).maybeSingle();
  const permissions = Array.isArray(role?.permissions) ? (role.permissions as string[]) : [];
  if (!adminHasPermission(perm, permissions)) {
    return json(403, `Your role does not include the ${perm} permission.`);
  }

  return { userId: auth.user.id, email, role: String(member.role), permissions, db };
}

/** Best-effort audit row (never fails the request). */
export async function auditAdminAction(
  admin: AdminCaller,
  action: string,
  target: { type: string; id?: string | null },
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await admin.db.from("admin_audit").insert({
      actor_user_id: admin.userId,
      actor_email: admin.email,
      action,
      target_type: target.type,
      target_id: target.id ?? null,
      details: details ?? null,
    });
  } catch {
    /* the audit trail must never block the action */
  }
}
