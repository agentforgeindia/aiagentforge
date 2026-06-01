// ============================================================
// Google Ads — Lead Form Extension webhook
// ============================================================
// Flow:
//   1. User fills the Lead Form on a Google Search / Display ad.
//   2. Google POSTs the lead data to this URL.
//   3. The payload's `google_key` must match GOOGLE_LEADS_WEBHOOK_KEY
//      (set both here and in the Google Ads "Webhook URL" config).
//   4. We parse the user_column_data array and insert into leads.
//
// Required env vars:
//   GOOGLE_LEADS_WEBHOOK_KEY   — random string YOU choose.
//                                Same value goes into Google Ads
//                                "Key" field for the lead form.
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ────────────────────────────────────────────────────────────
// Payload shape (Google Lead Form Extension v1.0)
//   {
//     lead_id: "...",
//     api_version: "1.0",
//     form_id: 12345,
//     campaign_id: 67890,
//     google_key: "your-secret-key",
//     is_test: false,
//     gcl_id: "...",
//     adgroup_id: 11111,
//     creative_id: 22222,
//     user_column_data: [
//       { column_name: "Full Name",  string_value: "Bhavin Joshi",  column_id: "FULL_NAME" },
//       { column_name: "Email",      string_value: "...",            column_id: "EMAIL" },
//       { column_name: "Phone Number", string_value: "+91...",       column_id: "PHONE_NUMBER" },
//       ...
//     ]
//   }
// ────────────────────────────────────────────────────────────

type GoogleLeadPayload = {
  lead_id?: string;
  api_version?: string;
  form_id?: number | string;
  campaign_id?: number | string;
  google_key?: string;
  is_test?: boolean;
  gcl_id?: string;
  adgroup_id?: number | string;
  creative_id?: number | string;
  user_column_data?: {
    column_name: string;
    string_value: string;
    column_id?: string;
  }[];
};

/** Pull a value by Google "column_id" (preferred) or column_name (fallback). */
function pick(
  cols: GoogleLeadPayload["user_column_data"],
  ids: string[],
  names: string[] = [],
): string | null {
  if (!cols) return null;
  for (const c of cols) {
    if (c.column_id && ids.includes(c.column_id)) {
      return c.string_value || null;
    }
  }
  // Fallback by visible label
  const lower = (s: string) => s.toLowerCase().trim();
  const wanted = names.map(lower);
  for (const c of cols) {
    if (wanted.includes(lower(c.column_name))) {
      return c.string_value || null;
    }
  }
  return null;
}

export async function POST(request: Request) {
  let body: GoogleLeadPayload;
  try {
    body = (await request.json()) as GoogleLeadPayload;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const expected = process.env.GOOGLE_LEADS_WEBHOOK_KEY;
  if (!expected) {
    console.error("[google-lead] GOOGLE_LEADS_WEBHOOK_KEY missing");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }
  if (!body.google_key || body.google_key !== expected) {
    console.warn("[google-lead] invalid google_key");
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  if (body.is_test) {
    // Google sometimes pings with is_test=true while configuring.
    return NextResponse.json({ success: true, test: true });
  }

  const cols = body.user_column_data ?? [];

  const fullName =
    pick(cols, ["FULL_NAME"], ["Full Name", "Name"]) ||
    [
      pick(cols, ["FIRST_NAME"], ["First Name"]),
      pick(cols, ["LAST_NAME"], ["Last Name"]),
    ]
      .filter(Boolean)
      .join(" ") ||
    "(no name)";

  const phone = pick(
    cols,
    ["PHONE_NUMBER"],
    ["Phone Number", "Phone", "Mobile", "Mobile Number"],
  );
  const email = pick(cols, ["EMAIL"], ["Email", "Email Address"]);
  const city = pick(cols, ["CITY"], ["City", "Location"]);
  const businessName = pick(
    cols,
    ["COMPANY_NAME"],
    ["Company", "Company Name", "Business", "Business Name"],
  );

  const supabase = supabaseAdmin();

  const payload = {
    name: fullName.slice(0, 200),
    email: email?.slice(0, 200) ?? null,
    phone: phone?.slice(0, 50) ?? null,
    business_name: businessName?.slice(0, 200) ?? null,
    city: city?.slice(0, 100) ?? null,
    source: "google" as const,
    source_detail: body.campaign_id
      ? `campaign:${body.campaign_id} / form:${body.form_id ?? "?"}`
      : body.form_id
        ? `form:${body.form_id}`
        : null,
    status: "new",
    notes: "Auto-imported from Google Lead Form",
    external_lead_id: body.lead_id ?? null,
    raw_payload: body as unknown as Record<string, unknown>,
  };

  const { error } = await supabase.from("leads").insert(payload);
  if (error) {
    if (
      error.code === "23505" ||
      error.message?.toLowerCase().includes("duplicate")
    ) {
      return NextResponse.json({ success: true, duplicate: true });
    }
    console.error("[google-lead] insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
