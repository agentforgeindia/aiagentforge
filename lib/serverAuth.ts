// ============================================================
// AgentForge server-side auth helper
// ============================================================
// Used by every protected /api/* route. The client passes its
// Supabase access token in the `Authorization` header; we ask
// Supabase to verify the JWT and return the matching user.
//
//   Browser:
//     const { data } = await supabase.auth.getSession();
//     fetch("/api/jewellery/generate", {
//       method: "POST",
//       headers: { Authorization: `Bearer ${data.session?.access_token}` },
//       body: JSON.stringify(payload),
//     });
//
//   Server route:
//     const user = await getUserFromRequest(req);
//     if (!user) return NextResponse.json({error:"unauth"}, {status:401});
// ============================================================

import { createClient } from "@supabase/supabase-js";

export type AuthedUser = {
  id: string;
  email: string | null;
};

/**
 * Extracts the JWT from the `Authorization: Bearer …` header,
 * asks Supabase to verify it, returns the user or `null`.
 *
 * Notes:
 *  • Uses the public anon key — `getUser(jwt)` validates the
 *    signature; service-role key is NOT needed for verification.
 *  • We never trust `body.user_id` again. Every protected route
 *    must call this and use the returned `user.id`.
 */
export async function getUserFromRequest(
  req: Request,
): Promise<AuthedUser | null> {
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!auth) return null;

  const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (!match) return null;
  const jwt = match[1].trim();
  if (!jwt) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  // A fresh, throwaway client — no session persistence, no autorefresh.
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user) return null;

  return { id: data.user.id, email: data.user.email ?? null };
}

/**
 * Same as getUserFromRequest, but throws a 401 Response on miss.
 * Useful inside route handlers:
 *
 *   const user = await requireUser(req);
 *   if (user instanceof Response) return user;
 */
export async function requireUser(
  req: Request,
): Promise<AuthedUser | Response> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Authentication required." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  return user;
}
