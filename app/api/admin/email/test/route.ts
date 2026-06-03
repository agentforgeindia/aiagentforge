// ============================================================
// POST /api/admin/email/test
// ============================================================
// Admin-only — sends a single rendered email immediately, then
// records the attempt in email_events so the queue viewer in
// /admin/email shows it alongside the rest.
//
// Auth model (mirrors /api/admin/payments/manual):
//   1. Bearer token of the calling admin in Authorization header.
//   2. The signed-in user's email must be present and active in
//      public.admin_users AND hold permission 'email.send'.
//   3. Service-role client then renders + sends + logs.
//
// Body:
//   {
//     template_slug:   "welcome" | "payment_receipt" | …,
//     recipient_email: "you@example.com",
//     sample_payload?: { full_name: "Test User", ... }
//   }
//
// Response:
//   200 { ok: true, status, dry_run, provider_message_id?, event_id }
//   4xx { error }
//
// EMAIL_DRY_RUN is always honoured — test sends will land as
// 'dry_run' until the operator flips the flag. That is the point
// of the dry-run flag: zero accidental sends.
// ============================================================

import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, sendEmail, isDryRun } from "@/lib/resend";

export const runtime = "nodejs";

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type CallerCheck =
  | { ok: true; email: string }
  | { ok: false; status: number; error: string };

async function authorizedAdmin(
  admin: SupabaseClient,
  authHeader: string | null,
  requiredPerm: string,
): Promise<CallerCheck> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Authentication required." };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  const { data, error } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) {
    return { ok: false, status: 401, error: "Invalid session." };
  }

  // Active row in admin_users.
  const { data: row } = await admin
    .from("admin_users")
    .select("email, active, role")
    .eq("email", email)
    .maybeSingle();
  if (!row || row.active === false) {
    return { ok: false, status: 403, error: "Not an active admin." };
  }

  // Permission gate — '*' (founder) always passes.
  const { data: perms } = await admin
    .from("admin_roles")
    .select("permissions")
    .eq("id", row.role)
    .maybeSingle();
  const allowed: string[] = (perms?.permissions as string[] | undefined) ?? [];
  const ok =
    allowed.includes("*") ||
    allowed.includes(requiredPerm) ||
    allowed.includes(`${requiredPerm.split(".")[0]}.*`);
  if (!ok) {
    return {
      ok: false,
      status: 403,
      error: `Missing permission: ${requiredPerm}`,
    };
  }

  return { ok: true, email };
}

type Body = {
  template_slug?: string;
  recipient_email?: string;
  sample_payload?: Record<string, unknown>;
};

export async function POST(req: Request) {
  let admin: SupabaseClient;
  try {
    admin = getServiceClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "server misconfigured" },
      { status: 500 },
    );
  }

  const check = await authorizedAdmin(
    admin,
    req.headers.get("authorization"),
    "email.send",
  );
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.template_slug?.trim();
  const recipient = body.recipient_email?.trim().toLowerCase();
  if (!slug || !recipient) {
    return NextResponse.json(
      { error: "template_slug and recipient_email are required" },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return NextResponse.json(
      { error: "recipient_email is not a valid email address" },
      { status: 400 },
    );
  }

  const { data: tpl, error: tplErr } = await admin
    .from("email_templates")
    .select("slug, subject, html_body, plain_body, enabled")
    .eq("slug", slug)
    .maybeSingle();
  if (tplErr || !tpl) {
    return NextResponse.json(
      { error: `Template '${slug}' not found` },
      { status: 404 },
    );
  }
  if (!tpl.enabled) {
    return NextResponse.json(
      { error: `Template '${slug}' is disabled` },
      { status: 400 },
    );
  }

  const payload = body.sample_payload ?? {};
  const subject = renderTemplate(tpl.subject, payload);
  const html = renderTemplate(tpl.html_body, payload);
  const plain = tpl.plain_body
    ? renderTemplate(tpl.plain_body, payload)
    : undefined;

  // Log the attempt first so even crashed sends leave a trail.
  const { data: inserted, error: insErr } = await admin
    .from("email_events")
    .insert({
      recipient_email: recipient,
      template_slug: slug,
      payload,
      scheduled_at: new Date().toISOString(),
      status: "queued",
    })
    .select("id")
    .single();
  if (insErr || !inserted) {
    return NextResponse.json(
      { error: insErr?.message ?? "Failed to log event" },
      { status: 500 },
    );
  }

  const eventId = inserted.id as string;
  const dry = isDryRun();

  if (dry) {
    await admin
      .from("email_events")
      .update({ status: "dry_run", sent_at: new Date().toISOString() })
      .eq("id", eventId);

    // Audit the action — useful for "who fired a test send"
    await admin.rpc("log_admin_action", {
      p_action: "email.test_send",
      p_target_type: "email_template",
      p_target_id: slug,
      p_details: { recipient, dry_run: true, event_id: eventId },
    });

    return NextResponse.json({
      ok: true,
      status: "dry_run",
      dry_run: true,
      event_id: eventId,
      preview: { subject, html, plain },
    });
  }

  const result = await sendEmail({
    to: recipient,
    subject,
    html,
    plain,
    tags: [
      { name: "template", value: slug },
      { name: "source", value: "admin_test" },
    ],
  });

  if (result.ok) {
    await admin
      .from("email_events")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: result.id,
        error_text: null,
      })
      .eq("id", eventId);
    await admin.rpc("log_admin_action", {
      p_action: "email.test_send",
      p_target_type: "email_template",
      p_target_id: slug,
      p_details: { recipient, dry_run: false, provider_message_id: result.id },
    });
    return NextResponse.json({
      ok: true,
      status: "sent",
      dry_run: false,
      event_id: eventId,
      provider_message_id: result.id,
    });
  }

  await admin
    .from("email_events")
    .update({
      status: "failed",
      error_text: result.error.slice(0, 1000),
    })
    .eq("id", eventId);
  return NextResponse.json(
    {
      ok: false,
      status: "failed",
      dry_run: false,
      event_id: eventId,
      error: result.error,
    },
    { status: 502 },
  );
}
