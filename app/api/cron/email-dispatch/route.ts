// ============================================================
// POST /api/cron/email-dispatch
// ============================================================
// The mailroom. Runs two passes back-to-back:
//
//   1. SCAN  — looks at profiles.plan_expires_at and enqueues
//              trial_ending (T-3) and renewal_due (T-0) events.
//              Dedupe keys are date-stamped so a daily double-run
//              is a no-op.
//
//   2. DISPATCH — pulls the next 50 queued events whose
//              scheduled_at <= now() and either sends them via
//              Resend or, when EMAIL_DRY_RUN=true (default),
//              just stamps them as 'dry_run'.
//
// Authentication: a single CRON_SECRET in the Authorization
// header. Use a long random value:  openssl rand -hex 32
//
// Env vars consumed:
//   CRON_SECRET            shared secret with the cron caller
//   EMAIL_DRY_RUN          "true" (default) | "false" | "0"
//   RESEND_API_KEY         re_…
//   RESEND_FROM_EMAIL      hello@aiagentforge.in
//   RESEND_FROM_NAME       AgentForge
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// ────────────────────────────────────────────────────────────
// VPS wire-up — paste these two files on the VPS once:
//
//   /etc/systemd/system/agentforge-email.service
//   ────────────────────────────────────────────
//   [Unit]
//   Description=AgentForge — flush email queue
//   After=network-online.target
//
//   [Service]
//   Type=oneshot
//   EnvironmentFile=/root/aiagentforge/.env.cron
//   ExecStart=/usr/bin/curl -fsS -X POST \
//     -H "Authorization: Bearer ${CRON_SECRET}" \
//     https://aiagentforge.in/api/cron/email-dispatch
//
//   /etc/systemd/system/agentforge-email.timer
//   ────────────────────────────────────────────
//   [Unit]
//   Description=AgentForge — email dispatch every 5 minutes
//
//   [Timer]
//   OnBootSec=2min
//   OnUnitActiveSec=5min
//   Unit=agentforge-email.service
//
//   [Install]
//   WantedBy=timers.target
//
//   Then on the box:
//     echo "CRON_SECRET=…" > /root/aiagentforge/.env.cron
//     chmod 600 /root/aiagentforge/.env.cron
//     systemctl daemon-reload
//     systemctl enable --now agentforge-email.timer
//     journalctl -u agentforge-email -f
// ============================================================

import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, sendEmail, isDryRun } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Service-role client (server-only) ───────────────────────

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Auth: constant-time secret compare ──────────────────────

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorizedCron(req: Request): boolean {
  const expected = (process.env.CRON_SECRET ?? "").trim();
  if (!expected) return false; // refuse if unset — prevents wide-open access
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  return timingSafeEqual(match[1].trim(), expected);
}

// ── Types ───────────────────────────────────────────────────

type EmailEvent = {
  id: string;
  recipient_email: string;
  template_slug: string;
  payload: Record<string, unknown>;
  retry_count: number;
};

type Template = {
  slug: string;
  subject: string;
  html_body: string;
  plain_body: string | null;
  enabled: boolean;
};

// ── Pass 1: scan profiles → enqueue T-3 and T-0 ─────────────

async function scanAndEnqueue(
  admin: SupabaseClient,
): Promise<{ scanned: number; enqueued: number }> {
  // Pull profiles whose plan_expires_at falls in either
  // window so we can dedupe-enqueue per row. Two days of slack
  // either side keeps us robust to cron skew or downtime.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const startISO = new Date(today.getTime() - 2 * 86400000).toISOString();
  const endISO = new Date(today.getTime() + 5 * 86400000).toISOString();

  const { data: rows, error } = await admin
    .from("profiles")
    .select("id, email, full_name, plan, plan_expires_at")
    .not("email", "is", null)
    .gte("plan_expires_at", startISO)
    .lte("plan_expires_at", endISO);

  if (error) {
    console.error("[cron/email-dispatch] scan error:", error);
    return { scanned: 0, enqueued: 0 };
  }

  let enqueued = 0;
  const scanned = rows?.length ?? 0;
  const todayMs = today.getTime();

  for (const r of rows ?? []) {
    if (!r.plan_expires_at) continue;
    const exp = new Date(r.plan_expires_at);
    const expMidnight = new Date(
      Date.UTC(exp.getUTCFullYear(), exp.getUTCMonth(), exp.getUTCDate()),
    );
    const dayDiff = Math.round((expMidnight.getTime() - todayMs) / 86400000);
    const expIso = expMidnight.toISOString().slice(0, 10);

    let slug: "trial_ending" | "renewal_due" | null = null;
    let payload: Record<string, unknown> = {};

    if (dayDiff === 3) {
      slug = "trial_ending";
      payload = {
        full_name: r.full_name ?? "",
        plan: r.plan ?? "",
        expires_on: expIso,
      };
    } else if (dayDiff === 0) {
      slug = "renewal_due";
      payload = {
        full_name: r.full_name ?? "",
        plan: r.plan ?? "",
        expired_on: expIso,
      };
    }

    if (!slug) continue;

    const dedupeKey = `${slug}:${r.id}:${expIso}`;
    const { data: newId, error: rpcErr } = await admin.rpc("enqueue_email", {
      p_slug: slug,
      p_recipient: r.email,
      p_user_id: r.id,
      p_payload: payload,
      p_scheduled_at: new Date().toISOString(),
      p_dedupe_key: dedupeKey,
    });
    if (rpcErr) {
      console.error("[cron/email-dispatch] enqueue error:", rpcErr);
      continue;
    }
    if (newId) enqueued += 1;
  }

  return { scanned, enqueued };
}

// ── Pass 2: dispatch up to N queued events ──────────────────

async function dispatchQueued(
  admin: SupabaseClient,
  limit: number,
): Promise<{
  dispatched: number;
  sent: number;
  dry_run: number;
  failed: number;
}> {
  const { data: rawEvents, error } = await admin
    .from("email_events")
    .select("id, recipient_email, template_slug, payload, retry_count")
    .eq("status", "queued")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[cron/email-dispatch] pull error:", error);
    return { dispatched: 0, sent: 0, dry_run: 0, failed: 0 };
  }

  const events = (rawEvents ?? []) as EmailEvent[];
  if (events.length === 0) {
    return { dispatched: 0, sent: 0, dry_run: 0, failed: 0 };
  }

  // Cache template rows for this tick — typical queue holds
  // a handful of slugs, no point in re-fetching.
  const templateCache = new Map<string, Template>();

  let sent = 0;
  let dryRun = 0;
  let failed = 0;
  const dry = isDryRun();

  for (const ev of events) {
    let tpl = templateCache.get(ev.template_slug);
    if (!tpl) {
      const { data: tplRow } = await admin
        .from("email_templates")
        .select("slug, subject, html_body, plain_body, enabled")
        .eq("slug", ev.template_slug)
        .maybeSingle();
      if (!tplRow) {
        await admin
          .from("email_events")
          .update({
            status: "failed",
            error_text: `template '${ev.template_slug}' not found`,
            retry_count: ev.retry_count + 1,
          })
          .eq("id", ev.id);
        failed += 1;
        continue;
      }
      tpl = tplRow as Template;
      templateCache.set(tpl.slug, tpl);
    }

    if (!tpl.enabled) {
      await admin
        .from("email_events")
        .update({
          status: "skipped",
          error_text: "template disabled",
          sent_at: new Date().toISOString(),
        })
        .eq("id", ev.id);
      continue;
    }

    const vars = (ev.payload ?? {}) as Record<string, unknown>;
    const subject = renderTemplate(tpl.subject, vars);
    const html = renderTemplate(tpl.html_body, vars);
    const plain = tpl.plain_body
      ? renderTemplate(tpl.plain_body, vars)
      : undefined;

    if (dry) {
      await admin
        .from("email_events")
        .update({
          status: "dry_run",
          sent_at: new Date().toISOString(),
          error_text: null,
        })
        .eq("id", ev.id);
      dryRun += 1;
      continue;
    }

    const result = await sendEmail({
      to: ev.recipient_email,
      subject,
      html,
      plain,
      tags: [
        { name: "template", value: tpl.slug },
        { name: "env", value: process.env.VERCEL_ENV ?? "vps" },
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
        .eq("id", ev.id);
      sent += 1;
    } else {
      await admin
        .from("email_events")
        .update({
          status: "failed",
          error_text: result.error.slice(0, 1000),
          retry_count: ev.retry_count + 1,
        })
        .eq("id", ev.id);
      failed += 1;
    }
  }

  return { dispatched: events.length, sent, dry_run: dryRun, failed };
}

// ── Route handler ───────────────────────────────────────────

export async function POST(req: Request) {
  if (!authorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let admin: SupabaseClient;
  try {
    admin = getServiceClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "server misconfigured" },
      { status: 500 },
    );
  }

  const scan = await scanAndEnqueue(admin);
  const dispatch = await dispatchQueued(admin, 50);

  // ── Daily founder report (9 PM IST = 15:30 UTC) ──────────────
  const hourUTC = new Date().getUTCHours();
  const founderEmail = process.env.FOUNDER_EMAIL ?? "info.agentforge@gmail.com";
  if (hourUTC >= 15 && hourUTC <= 16 && founderEmail) {
    try {
      const { data: metrics } = await admin.rpc("daily_report_metrics");
      if (metrics && !metrics.error) {
        const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
        const payload = {
          date:             today,
          revenue_today:    (metrics.revenue_today ?? 0).toLocaleString("en-IN"),
          revenue_week:     (metrics.revenue_week ?? 0).toLocaleString("en-IN"),
          new_signups:      metrics.new_signups ?? 0,
          new_leads:        metrics.new_leads ?? 0,
          paid_today:       metrics.paid_today ?? 0,
          gens_today:       metrics.gens_today ?? 0,
          failed_today:     metrics.failed_today ?? 0,
          failed_color:     (metrics.failed_today ?? 0) > 0 ? "#dc2626" : "#16a34a",
          credits_used:     (metrics.credits_used ?? 0).toLocaleString("en-IN"),
          open_tickets:     metrics.open_tickets ?? 0,
          pending_followups:metrics.pending_followups ?? 0,
          expiring_7d:      metrics.expiring_7d ?? 0,
          top_agent:        metrics.top_agent ?? "—",
        };
        const dedupeKey = `daily_report:founder:${new Date().toISOString().slice(0, 10)}`;
        await admin.rpc("enqueue_email", {
          p_slug: "daily_report",
          p_recipient: founderEmail,
          p_user_id: null,
          p_payload: payload,
          p_scheduled_at: new Date().toISOString(),
          p_dedupe_key: dedupeKey,
        });
      }
    } catch (e) {
      console.error("[cron] daily report error:", e);
    }
  }

  return NextResponse.json({
    ok: true,
    dry_run_mode: isDryRun(),
    ...scan,
    ...dispatch,
  });
}
