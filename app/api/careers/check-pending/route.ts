// GET /api/careers/check-pending
// Cron endpoint: finds candidates who passed the test >72 hours ago
// but are still in 'passed' stage (no HR response yet) → sends alert to hr@aiagentforge.in
//
// Setup:
//   npm install nodemailer @types/nodemailer
//   Add to .env.local:
//     SMTP_HOST=smtp.gmail.com
//     SMTP_PORT=587
//     SMTP_USER=hr@aiagentforge.in
//     SMTP_PASS=<Gmail App Password>
//     CRON_SECRET=<any random secret>
//
//   Call this endpoint via a server cron every hour:
//   PM2 ecosystem.config.js → add a cron job:
//     { name: "careers-cron", script: "curl", args: "-s https://aiagentforge.in/api/careers/check-pending?secret=<CRON_SECRET>", cron_restart: "0 9 * * *" }
//   OR add to crontab:
//     0 * * * * curl -s "https://aiagentforge.in/api/careers/check-pending?secret=<CRON_SECRET>"

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function sendEmail(to: string, subject: string, html: string) {
  // Dynamic import so missing nodemailer doesn't break build
  let nodemailer: any;
  try {
    nodemailer = (await import("nodemailer")).default;
  } catch {
    console.error("[check-pending] nodemailer not installed. Run: npm install nodemailer @types/nodemailer");
    return false;
  }

  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASS ?? "";

  if (!user || !pass) {
    console.error("[check-pending] SMTP_USER / SMTP_PASS not set in env");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({ from: user, to, subject, html });
    return true;
  } catch (err) {
    console.error("[check-pending] Email send failed:", err);
    return false;
  }
}

export async function GET(req: Request) {
  // Simple secret-based auth so only the cron can call this
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const envSecret = process.env.CRON_SECRET;
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = svc();

  // Find candidates in "passed" stage whose most recent passing attempt was >72 hours ago
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { data: stale } = await db
    .from("candidates")
    .select(`
      id, name, mobile, email, role_slug, stage, created_at,
      assessment_attempts!inner(id, passed, created_at)
    `)
    .eq("stage", "passed")
    .eq("assessment_attempts.passed", true)
    .lt("assessment_attempts.created_at", cutoff);

  if (!stale || stale.length === 0) {
    return NextResponse.json({ ok: true, message: "No pending candidates beyond 72 hours." });
  }

  // Build email body
  const rows = stale.map((c: any) => {
    const passedAt = c.assessment_attempts?.[0]?.created_at ?? c.created_at;
    const hours = Math.round((Date.now() - new Date(passedAt).getTime()) / 3600000);
    return `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;font-weight:700;">${c.name}</td>
        <td style="padding:10px 12px;">${c.mobile}</td>
        <td style="padding:10px 12px;">${c.email ?? "—"}</td>
        <td style="padding:10px 12px;text-transform:capitalize;">${(c.role_slug ?? "").replace(/-/g, " ")}</td>
        <td style="padding:10px 12px;font-weight:700;color:#ef4444;">${hours}h ago</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#fff8e8;padding:32px;">
  <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#06b6d4,#3b82f6,#8b5cf6);border-radius:12px;padding:24px;text-align:center;color:#fff;margin-bottom:24px;">
      <h1 style="margin:0;font-size:22px;font-weight:900;">⏰ HR Action Required</h1>
      <p style="margin:8px 0 0;opacity:.85;font-size:14px;">Candidates awaiting response for more than 72 hours</p>
    </div>
    <p style="font-size:14px;color:#374151;">The following <strong>${stale.length} candidate(s)</strong> passed their assessment more than 72 hours ago and have not yet received a response. Please contact them as soon as possible.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:10px 12px;text-align:left;">Name</th>
          <th style="padding:10px 12px;text-align:left;">Mobile</th>
          <th style="padding:10px 12px;text-align:left;">Email</th>
          <th style="padding:10px 12px;text-align:left;">Role</th>
          <th style="padding:10px 12px;text-align:left;">Passed</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:10px;border-left:4px solid #f59e0b;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">Action: Please call or WhatsApp each candidate to confirm next steps. Update their stage in Supabase → candidates table once contacted.</p>
    </div>
    <p style="margin-top:24px;font-size:11px;color:#9ca3af;text-align:center;">Auto-generated by AgentForge HR System · agentforge.in</p>
  </div>
</body>
</html>`;

  const sent = await sendEmail(
    "hr@aiagentforge.in",
    `⏰ HR Alert: ${stale.length} candidate(s) waiting 72h+ for response — AgentForge`,
    html,
  );

  return NextResponse.json({
    ok: true,
    candidates_found: stale.length,
    email_sent: sent,
    message: sent
      ? `Alert sent to hr@aiagentforge.in for ${stale.length} candidate(s).`
      : `Found ${stale.length} candidate(s) but email failed — check SMTP config.`,
  });
}
