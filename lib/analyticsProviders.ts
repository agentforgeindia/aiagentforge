// ============================================================
// AgentForge — Analytics providers (Meta Ads, GA4, Clarity)
// ============================================================
// Each fetcher returns { configured, data?, note? } and never
// throws — the dashboard shows whatever is available.
// ============================================================

import crypto from "crypto";

type Result = { configured: boolean; data?: any; note?: string };

// ── Meta Ads (Marketing API) ─────────────────────────────────
export async function fetchMetaAds(): Promise<Result> {
  const acct = process.env.META_AD_ACCOUNT_ID;
  const token = process.env.META_ADS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
  if (!acct || !token) return { configured: false, note: "Set META_AD_ACCOUNT_ID + token" };
  const id = acct.startsWith("act_") ? acct : `act_${acct}`;
  try {
    const url = `https://graph.facebook.com/v21.0/${id}/insights?fields=spend,impressions,clicks,ctr,cpc,reach&date_preset=last_7d&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    if (!res.ok) return { configured: true, note: json?.error?.message ?? `HTTP ${res.status}` };
    const d = json?.data?.[0] ?? {};
    return {
      configured: true,
      data: {
        spend: Number(d.spend ?? 0),
        impressions: Number(d.impressions ?? 0),
        clicks: Number(d.clicks ?? 0),
        ctr: Number(d.ctr ?? 0),
        cpc: Number(d.cpc ?? 0),
        reach: Number(d.reach ?? 0),
      },
    };
  } catch (e) {
    return { configured: true, note: e instanceof Error ? e.message : "fetch failed" };
  }
}

// ── GA4 (Data API via service account) ───────────────────────
let ga4LastError = "";
async function ga4AccessToken(): Promise<string | null> {
  const email = process.env.GA4_SA_EMAIL?.trim();
  let key = process.env.GA4_SA_PRIVATE_KEY?.trim();
  if (!email || !key) { ga4LastError = "missing email/key"; return null; }
  key = key.replace(/\\n/g, "\n");
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
      iss: email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${b64(header)}.${b64(claim)}`;
    const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");
    const jwt = `${unsigned}.${sig}`;
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    if (!json.access_token) ga4LastError = json.error_description || json.error || "no access_token";
    return json.access_token ?? null;
  } catch (e) { ga4LastError = e instanceof Error ? e.message : "signing/network error"; return null; }
}

export async function fetchGA4(): Promise<Result> {
  const prop = process.env.GA4_PROPERTY_ID?.trim();
  if (!prop || !process.env.GA4_SA_EMAIL) return { configured: false, note: "Set GA4_PROPERTY_ID + GA4_SA_EMAIL + GA4_SA_PRIVATE_KEY" };
  const token = await ga4AccessToken();
  if (!token) return { configured: true, note: `GA4 auth failed: ${ga4LastError}` };
  try {
    const base = `https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const sig = () => AbortSignal.timeout(8000);

    // Totals (7 days)
    const totalsRes = await fetch(base, { method: "POST", headers, signal: sig(), body: JSON.stringify({
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "newUsers" }],
    }) });
    const totals = await totalsRes.json();
    const row = totals?.rows?.[0]?.metricValues ?? [];

    // Top pages
    const pagesRes = await fetch(base, { method: "POST", headers, signal: sig(), body: JSON.stringify({
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 8,
    }) });
    const pages = await pagesRes.json();

    // Sources
    const srcRes = await fetch(base, { method: "POST", headers, signal: sig(), body: JSON.stringify({
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 6,
    }) });
    const sources = await srcRes.json();

    return {
      configured: true,
      data: {
        active_users: Number(row[0]?.value ?? 0),
        sessions: Number(row[1]?.value ?? 0),
        pageviews: Number(row[2]?.value ?? 0),
        new_users: Number(row[3]?.value ?? 0),
        top_pages: (pages?.rows ?? []).map((r: any) => ({ path: r.dimensionValues[0].value, views: Number(r.metricValues[0].value) })),
        sources: (sources?.rows ?? []).map((r: any) => ({ channel: r.dimensionValues[0].value, sessions: Number(r.metricValues[0].value) })),
      },
    };
  } catch (e) {
    return { configured: true, note: e instanceof Error ? e.message : "GA4 fetch failed" };
  }
}

// ── Microsoft Clarity (Data Export API) ──────────────────────
export async function fetchClarity(): Promise<Result> {
  const token = process.env.CLARITY_API_TOKEN?.trim();
  if (!token) return { configured: false, note: "Set CLARITY_API_TOKEN (Clarity → Settings → Data Export)" };
  try {
    const res = await fetch("https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=3", {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { configured: true, note: `Clarity HTTP ${res.status}` };
    const json = await res.json();
    // Clarity returns an array of metric objects.
    const find = (name: string) => {
      const m = Array.isArray(json) ? json.find((x: any) => x.metricName === name) : null;
      return m?.information?.[0] ?? null;
    };
    return {
      configured: true,
      data: {
        sessions:    Number(find("Traffic")?.totalSessionCount ?? find("Traffic")?.sessionsCount ?? 0),
        pages:       Number(find("PopularPages")?.totalSessionCount ?? 0),
        dead_clicks: Number(find("DeadClickCount")?.subTotal ?? 0),
        rage_clicks: Number(find("RageClickCount")?.subTotal ?? 0),
        raw: json,
      },
    };
  } catch (e) {
    return { configured: true, note: e instanceof Error ? e.message : "Clarity fetch failed" };
  }
}
