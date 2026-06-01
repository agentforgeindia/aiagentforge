// ============================================================
// Meta (Facebook + Instagram) Lead Ads webhook
// ============================================================
// Flow:
//   1. User fills FB/IG Lead Form in their feed.
//   2. Meta POSTs a "leadgen" event here with a leadgen_id.
//   3. We call Meta Graph API to fetch the full lead row
//      (name, phone, email, custom fields).
//   4. We INSERT into public.leads with source = "facebook"
//      or "instagram", marking the lead as new.
//
// Two endpoints in one file:
//   GET  → Meta verification handshake (hub.challenge)
//   POST → actual leadgen events (signature-verified)
//
// Required env vars:
//   META_WEBHOOK_VERIFY_TOKEN  — random string YOU choose.
//                                Paste the same string in the
//                                Meta App webhook config.
//   META_APP_SECRET            — from Meta App → Settings → Basic
//   META_PAGE_ACCESS_TOKEN     — long-lived Page token for the
//                                Page that runs the ads
//   NEXT_PUBLIC_SUPABASE_URL   — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY  — service role, server-only
// ============================================================

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Verify the X-Hub-Signature-256 header matches body+APP_SECRET. */
function verifyMetaSignature(rawBody: string, signature: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error("META_APP_SECRET missing");
  if (!signature) return false;

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

  // timing-safe compare
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Fetch full lead row (name, phone, email, etc.) from Meta Graph. */
async function fetchLeadFromGraph(leadgenId: string): Promise<{
  fields: Record<string, string>;
  raw: unknown;
} | null> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    console.error("[meta-lead] META_PAGE_ACCESS_TOKEN missing");
    return null;
  }
  const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${encodeURIComponent(
    token,
  )}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(
      "[meta-lead] Graph fetch failed:",
      res.status,
      await res.text().catch(() => ""),
    );
    return null;
  }
  const data = (await res.json()) as {
    field_data?: { name: string; values: string[] }[];
  };
  const fields: Record<string, string> = {};
  for (const f of data.field_data ?? []) {
    fields[f.name] = (f.values || [])[0] ?? "";
  }
  return { fields, raw: data };
}

// ────────────────────────────────────────────────────────────
// GET  — Meta one-time verification.
// ────────────────────────────────────────────────────────────
// Meta calls GET with ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
// We must echo hub.challenge if the token matches.
// ────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && token === expected) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ────────────────────────────────────────────────────────────
// POST — leadgen events.
// ────────────────────────────────────────────────────────────
type MetaWebhookBody = {
  object?: string;
  entry?: {
    id?: string;
    time?: number;
    changes?: {
      field?: string;
      value?: {
        leadgen_id?: string;
        page_id?: string;
        form_id?: string;
        ad_id?: string;
        adgroup_id?: string;
        campaign_id?: string;
        created_time?: number;
      };
    }[];
  }[];
};

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }

  const sig = request.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, sig)) {
    console.warn("[meta-lead] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: MetaWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  let inserted = 0;
  let skipped = 0;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;
      const v = change.value ?? {};
      const leadgenId = v.leadgen_id;
      if (!leadgenId) continue;

      // Fetch full lead from Graph
      const full = await fetchLeadFromGraph(leadgenId);
      const fields = full?.fields ?? {};

      const name =
        fields.full_name ||
        [fields.first_name, fields.last_name].filter(Boolean).join(" ") ||
        "(no name)";
      const phone =
        fields.phone_number || fields.phone || fields.mobile_number || null;
      const email = fields.email || null;
      const city = fields.city || fields.location || null;
      const businessName = fields.company_name || fields.business || null;

      // Try to infer Instagram vs Facebook from the page that owns
      // the leadgen. Meta still tags it as 'page' though — both
      // sources share the same webhook. We assume FB by default.
      const source = "facebook" as const;

      const payload = {
        name: name.slice(0, 200),
        email: email?.slice(0, 200) ?? null,
        phone: phone?.slice(0, 50) ?? null,
        business_name: businessName?.slice(0, 200) ?? null,
        city: city?.slice(0, 100) ?? null,
        source,
        source_detail: v.campaign_id
          ? `campaign:${v.campaign_id} / form:${v.form_id ?? "?"}`
          : v.form_id
            ? `form:${v.form_id}`
            : null,
        status: "new",
        notes: "Auto-imported from Meta Lead Ads",
        external_lead_id: leadgenId,
        raw_payload: full?.raw ?? change,
      };

      const { error } = await supabase
        .from("leads")
        .insert(payload);

      if (error) {
        // 23505 = unique_violation → already imported → skip silently
        if (
          error.code === "23505" ||
          error.message?.toLowerCase().includes("duplicate")
        ) {
          skipped++;
          continue;
        }
        console.error("[meta-lead] insert error:", error.message);
        continue;
      }
      inserted++;
    }
  }

  return NextResponse.json({ success: true, inserted, skipped });
}
