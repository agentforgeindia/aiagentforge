// ============================================================
// POST /api/admin/expenses/sync
// ============================================================
// Pulls real/estimated costs into finance_expenses:
//   • Meta Ads   — live spend via Marketing API (needs META_AD_ACCOUNT_ID
//                  + a token with ads_read; falls back to PAGE token)
//   • OpenAI     — usage cost via Costs API (needs OPENAI_ADMIN_KEY)
//   • FAL        — estimated from generations × agent_costs (no key needed)
//
// Idempotent: one row per provider per day (source, expense_date).
// Re-running the same day updates the amount instead of duplicating.
//
// Auth: caller must be in admin_users (Bearer access_token), OR a
// valid CRON_SECRET bearer (so the nightly cron can call it too).
// ============================================================

import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function authorize(req: Request, admin: SupabaseClient): Promise<boolean> {
  const header = req.headers.get("authorization") ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(header.trim())?.[1]?.trim();
  if (!token) return false;

  // 1) Cron secret path
  const cronSecret = (process.env.CRON_SECRET ?? "").trim();
  if (cronSecret && token === cronSecret) return true;

  // 2) Admin user path
  const { data } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await admin
    .from("admin_users").select("email").eq("email", email).maybeSingle();
  return Boolean(row);
}

async function getUsdInrRate(admin: SupabaseClient): Promise<number> {
  const { data } = await admin
    .from("ai_cost_settings").select("usd_to_inr_rate").eq("id", 1).maybeSingle();
  return Number(data?.usd_to_inr_rate) || 83.5;
}

async function upsertExpense(
  admin: SupabaseClient,
  row: {
    source: string; category: string; label: string;
    amount_inr: number; expense_date: string; is_estimated: boolean;
    external_ref?: string;
  },
) {
  // Manual delete+insert keyed on (source, expense_date) so re-sync overwrites.
  await admin.from("finance_expenses")
    .delete().eq("source", row.source).eq("expense_date", row.expense_date);
  await admin.from("finance_expenses").insert(row);
}

// ── Meta Ads spend (today) ───────────────────────────────────
async function syncMeta(admin: SupabaseClient, today: string) {
  const acct = process.env.META_AD_ACCOUNT_ID;          // e.g. act_123456
  const token = process.env.META_ADS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
  if (!acct || !token) return { provider: "meta", ok: false, note: "META_AD_ACCOUNT_ID or token missing" };

  const acctId = acct.startsWith("act_") ? acct : `act_${acct}`;
  const url = `https://graph.facebook.com/v21.0/${acctId}/insights?fields=spend&date_preset=today&access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok) return { provider: "meta", ok: false, note: json?.error?.message ?? `HTTP ${res.status}` };
    const spend = Number(json?.data?.[0]?.spend ?? 0);
    if (spend > 0) {
      await upsertExpense(admin, {
        source: "meta_sync", category: "meta_ads",
        label: "Meta Ads spend (auto)", amount_inr: Math.round(spend * 100) / 100,
        expense_date: today, is_estimated: false, external_ref: acctId,
      });
    }
    return { provider: "meta", ok: true, amount: spend };
  } catch (e) {
    return { provider: "meta", ok: false, note: e instanceof Error ? e.message : "fetch failed" };
  }
}

// ── OpenAI usage cost (today) ────────────────────────────────
async function syncOpenAI(admin: SupabaseClient, today: string, rate: number) {
  const key = process.env.OPENAI_ADMIN_KEY; // org admin key (sk-admin-...)
  if (!key) return { provider: "openai", ok: false, note: "OPENAI_ADMIN_KEY missing" };

  const startTs = Math.floor(new Date(today + "T00:00:00Z").getTime() / 1000);
  const url = `https://api.openai.com/v1/organization/costs?start_time=${startTs}&limit=1`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    const json = await res.json();
    if (!res.ok) return { provider: "openai", ok: false, note: json?.error?.message ?? `HTTP ${res.status}` };
    // Sum all amounts in the bucket(s) — value is in USD.
    let usd = 0;
    for (const bucket of json?.data ?? []) {
      for (const r of bucket?.results ?? []) usd += Number(r?.amount?.value ?? 0);
    }
    if (usd > 0) {
      await upsertExpense(admin, {
        source: "openai_sync", category: "api_cost",
        label: "OpenAI usage (auto)", amount_inr: Math.round(usd * rate * 100) / 100,
        expense_date: today, is_estimated: false, external_ref: `usd:${usd.toFixed(4)}`,
      });
    }
    return { provider: "openai", ok: true, usd };
  } catch (e) {
    return { provider: "openai", ok: false, note: e instanceof Error ? e.message : "fetch failed" };
  }
}

// ── FAL estimated cost (today) from generations × agent_costs ─
async function syncFal(admin: SupabaseClient, today: string, rate: number) {
  try {
    // FAL powers the image agents. Estimate today's cost as
    // (completed gens per agent) × (agent_costs.cost_per_generation_usd).
    const { data: costs } = await admin
      .from("agent_costs").select("agent_slug, cost_per_generation_usd");
    const costMap = new Map<string, number>();
    for (const c of costs ?? []) costMap.set(c.agent_slug, Number(c.cost_per_generation_usd) || 0);

    const { data: gens } = await admin
      .from("generations")
      .select("agent_type, agent_slug, agent, status, created_at")
      .gte("created_at", today + "T00:00:00Z");

    let usd = 0;
    for (const g of gens ?? []) {
      if (g.status === "failed") continue; // failed gens usually not billed
      const slug = g.agent_type ?? g.agent_slug ?? g.agent ?? "";
      usd += costMap.get(slug) ?? 0.04; // default per-gen estimate
    }
    if (usd > 0) {
      await upsertExpense(admin, {
        source: "fal_sync", category: "api_cost",
        label: "FAL image generation (estimated)", amount_inr: Math.round(usd * rate * 100) / 100,
        expense_date: today, is_estimated: true, external_ref: `usd:${usd.toFixed(4)}`,
      });
    }
    return { provider: "fal", ok: true, usd, estimated: true };
  } catch (e) {
    return { provider: "fal", ok: false, note: e instanceof Error ? e.message : "query failed" };
  }
}

export async function POST(req: Request) {
  let admin: SupabaseClient;
  try { admin = getServiceClient(); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "misconfigured" }, { status: 500 }); }

  if (!(await authorize(req, admin))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const rate = await getUsdInrRate(admin);

  const results = await Promise.all([
    syncMeta(admin, today),
    syncOpenAI(admin, today, rate),
    syncFal(admin, today, rate),
  ]);

  return NextResponse.json({ ok: true, date: today, usd_to_inr: rate, results });
}
