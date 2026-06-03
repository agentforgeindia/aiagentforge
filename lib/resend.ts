// ============================================================
// AgentForge — Resend client + mustache renderer
// ============================================================
// No SDK dependency — we hit Resend's REST API directly with
// fetch. That keeps the package surface clean and avoids tying
// us to a specific SDK version.
//
// Three exports:
//   • renderTemplate(body, vars)
//       — replaces {{var}} (HTML-escaped) and {{{var}}} (raw)
//         in a string. Missing vars render as ''.
//   • sendEmail({to, subject, html, plain?, replyTo?, tags?})
//       — POSTs to https://api.resend.com/emails.
//   • isDryRun()
//       — true unless EMAIL_DRY_RUN is explicitly 'false' or '0'.
//
// Env vars consumed (server-side, NEVER NEXT_PUBLIC_*):
//   RESEND_API_KEY        re_xxx…
//   RESEND_FROM_EMAIL     hello@aiagentforge.in
//   RESEND_FROM_NAME      AgentForge
//   EMAIL_DRY_RUN         "true" (default) | "false" | "0"
// ============================================================

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// ── Mustache renderer ───────────────────────────────────────

const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);
}

function lookup(vars: Record<string, unknown>, key: string): string {
  const v = vars[key];
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
}

/**
 * Replaces {{key}} (HTML-escaped) and {{{key}}} (raw) in `body`
 * with values from `vars`. Whitespace inside the braces is OK.
 * Missing keys collapse to ''.
 */
export function renderTemplate(
  body: string,
  vars: Record<string, unknown>,
): string {
  if (!body) return "";
  // {{{ key }}} first so it doesn't get clobbered by the {{ key }} pass.
  const rawPass = body.replace(/\{\{\{\s*([\w.-]+)\s*\}\}\}/g, (_, key) =>
    lookup(vars, key),
  );
  return rawPass.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) =>
    escapeHtml(lookup(vars, key)),
  );
}

// ── Dry-run flag ────────────────────────────────────────────

/**
 * Defaults to TRUE — safer to keep emails parked until the
 * operator explicitly turns the dispatcher live.
 */
export function isDryRun(): boolean {
  const v = (process.env.EMAIL_DRY_RUN ?? "").trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off" || v === "no") return false;
  return true;
}

// ── Send ────────────────────────────────────────────────────

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  plain?: string;
  replyTo?: string;
  /** Resend supports up to 50 tags per message — key/value strings only. */
  tags?: { name: string; value: string }[];
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Calls Resend's REST API. Returns a discriminated union so
 * callers don't need try/catch boilerplate.
 *
 * Does NOT short-circuit on dry-run — that's the dispatcher's
 * responsibility. Keeping send pure means tests can call it
 * with EMAIL_DRY_RUN=false and a fake key to verify wire-up.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  const fromEmail = (process.env.RESEND_FROM_EMAIL ?? "").trim();
  if (!fromEmail) {
    return { ok: false, error: "RESEND_FROM_EMAIL missing" };
  }
  const fromName = (process.env.RESEND_FROM_NAME ?? "").trim();
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const body: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: input.subject,
    html: input.html,
  };
  if (input.plain && input.plain.length > 0) body.text = input.plain;
  if (input.replyTo) body.reply_to = input.replyTo;
  if (input.tags && input.tags.length > 0) body.tags = input.tags;

  let resp: Response;
  try {
    resp = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? `network: ${e.message}` : "network error",
    };
  }

  let parsed: unknown = null;
  try {
    parsed = await resp.json();
  } catch {
    // Resend always returns JSON; if it doesn't, treat the HTTP
    // status as the truth and report the raw status text.
  }

  if (!resp.ok) {
    const errMsg =
      (parsed as { message?: string } | null)?.message ??
      `HTTP ${resp.status} ${resp.statusText}`;
    return { ok: false, error: errMsg };
  }

  const id = (parsed as { id?: string } | null)?.id;
  if (!id) {
    return { ok: false, error: "Resend response missing id" };
  }
  return { ok: true, id };
}
