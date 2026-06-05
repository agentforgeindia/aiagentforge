// ============================================================
// agentEnabled — checks agent_costs.enabled before a generation
// is forwarded to n8n. Disabling an agent in /admin/agents now
// actually stops new generations (fail-open if DB unreachable).
// ============================================================

export async function isAgentEnabled(slug: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return true; // fail open — never block on misconfig
  try {
    const res = await fetch(
      `${url}/rest/v1/agent_costs?agent_slug=eq.${encodeURIComponent(slug)}&select=enabled`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    if (!res.ok) return true;
    const rows = (await res.json()) as { enabled?: boolean }[];
    // Only block if a row exists AND is explicitly disabled.
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.enabled === false) return false;
    return true;
  } catch {
    return true;
  }
}
