// ============================================================
// Creator (influencer) portal — browser side of the session.
// ============================================================
// The session token from /api/careers/influencer/lookup (or from a
// new application) is kept in localStorage and sent with every
// creator API call in the `x-af-influencer` header.
//
// Team members opening a creator's dashboard from the admin panel
// have no creator token; their admin login is sent instead and the
// server gives them read-only access.
// ============================================================

import { supabase } from "@/lib/supabase";

const TOKEN_KEY = "af_influencer_session";
const CID_KEY = "__inf_cid";

export function saveInfluencerSession(token: string | null | undefined, candidateId?: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    if (candidateId) window.localStorage.setItem(CID_KEY, candidateId);
  } catch {
    /* storage blocked — the person simply logs in again next time */
  }
}

export function clearInfluencerSession(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(CID_KEY);
  } catch {
    /* nothing to clear */
  }
}

export function hasInfluencerSession(): boolean {
  try {
    return Boolean(window.localStorage.getItem(TOKEN_KEY));
  } catch {
    return false;
  }
}

/** Headers for a creator API call (JSON by default). */
export async function influencerHeaders(json = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = json ? { "Content-Type": "application/json" } : {};
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) headers["x-af-influencer"] = token;
  } catch {
    /* no storage */
  }
  try {
    const { data } = await supabase.auth.getSession();
    const jwt = data.session?.access_token;
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
  } catch {
    /* not signed in to the main site — fine */
  }
  return headers;
}
