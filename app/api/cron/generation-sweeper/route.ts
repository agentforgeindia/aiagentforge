// ============================================================
// POST /api/cron/generation-sweeper
// ============================================================
// The safety net for generations. The pages only watch a job for
// about 3 minutes and only while the tab is open; if the user
// closes it, or n8n dies half-way, the row used to stay "pending"
// or "processing" for ever and the credits were never returned.
//
// Each run does three small passes:
//
//   1. RECOVER / FAIL — rows still pending / processing / queued
//      after STALE_MINUTES:
//        • an output image is already saved → mark "completed"
//          (the workflow finished but its last update was lost);
//        • otherwise                        → mark "failed".
//
//   2. REFUND — failed rows whose credits were not settled yet are
//      refunded from the credit ledger (lib/generationRefund.ts):
//      the amount is what is still charged, never more, never twice.
//      Rows from before the ledger existed are left for a person to
//      decide (reported as `legacy_unsettled`).
//
//   3. KEEP IMAGES — finished rows whose image still sits on the AI
//      provider's temporary link are copied into our storage.
//
// Add `?dry=1` to see what a run WOULD do without changing anything.
//
// Authentication: Authorization: Bearer <CRON_SECRET>  (same secret
// as /api/cron/email-dispatch). Refuses everything if it is unset.
//
// Env vars:
//   CRON_SECRET
//   GENERATION_STALE_MINUTES   optional, default 30 (minimum 10)
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// ────────────────────────────────────────────────────────────
// VPS wire-up (once) — same pattern as the email timer:
//
//   /etc/systemd/system/agentforge-sweeper.service
//     [Unit]
//     Description=AgentForge — generation sweeper
//     After=network-online.target
//     [Service]
//     Type=oneshot
//     EnvironmentFile=/root/aiagentforge/.env.cron
//     ExecStart=/usr/bin/curl -fsS -X POST \
//       -H "Authorization: Bearer ${CRON_SECRET}" \
//       https://aiagentforge.in/api/cron/generation-sweeper
//
//   /etc/systemd/system/agentforge-sweeper.timer
//     [Unit]
//     Description=AgentForge — generation sweeper every 10 minutes
//     [Timer]
//     OnBootSec=3min
//     OnUnitActiveSec=10min
//     Unit=agentforge-sweeper.service
//     [Install]
//     WantedBy=timers.target
//
//   systemctl daemon-reload && systemctl enable --now agentforge-sweeper.timer
// ============================================================

import { NextResponse } from "next/server";

import { authorizedCron } from "@/lib/cronAuth";
import { serviceDb } from "@/lib/creditsServer";
import {
  LEDGER_RECORDS_DEDUCTIONS_SINCE,
  REFUND_ROW_COLUMNS,
  refundFailedGeneration,
  type RefundableRow,
} from "@/lib/generationRefund";
import {
  MIRROR_ROW_COLUMNS,
  mirrorProviderImage,
  type MirrorableRow,
} from "@/lib/mirrorProviderImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNFINISHED = ["pending", "processing", "queued"];
const BATCH = 50;
const MIRROR_BATCH = 10;
/** Leave n8n's own failure handling (mark failed → refund) time to finish. */
const SETTLE_DELAY_MS = 3 * 60 * 1000;
/** Provider links die after a while — older ones are not worth retrying. */
const MIRROR_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function staleMinutes(): number {
  const n = Math.floor(Number(process.env.GENERATION_STALE_MINUTES));
  return Number.isFinite(n) && n >= 10 ? n : 30;
}

type StaleRow = RefundableRow & {
  output_url: string | null;
  output_image_url: string | null;
  image_url: string | null;
};

export async function POST(req: Request) {
  if (!authorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  const db = serviceDb();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const ledgerStartIso = new Date(LEDGER_RECORDS_DEDUCTIONS_SINCE).toISOString();

  const report = {
    dry_run: dryRun,
    stale_minutes: staleMinutes(),
    recovered: 0,
    marked_failed: 0,
    refunded_generations: 0,
    refunded_credits: 0,
    already_settled: 0,
    waiting: 0,
    legacy_unsettled: 0,
    images_saved: 0,
    images_gone: 0,
    errors: [] as string[],
  };

  // ── 1. Recover or fail stale rows ──────────────────────────
  const staleBefore = new Date(now - staleMinutes() * 60_000).toISOString();
  const { data: staleData, error: staleErr } = await db
    .from("generations")
    .select(`${REFUND_ROW_COLUMNS}, output_url, output_image_url, image_url`)
    .in("status", UNFINISHED)
    .lt("created_at", staleBefore)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (staleErr) report.errors.push(`stale scan: ${staleErr.message}`);

  for (const row of (staleData ?? []) as unknown as StaleRow[]) {
    const hasImage = Boolean(row.output_url || row.output_image_url || row.image_url);
    if (dryRun) {
      if (hasImage) report.recovered += 1;
      else report.marked_failed += 1;
      continue;
    }
    const patch = hasImage
      ? { status: "completed", completed_at: nowIso, updated_at: nowIso }
      : {
          status: "failed",
          error_message: "Timed out — the image was not finished. Any credits charged are refunded automatically.",
          updated_at: nowIso,
        };
    // Conditional on the status so a job that finishes at this very
    // moment is never overwritten.
    const { data: changed, error } = await db
      .from("generations")
      .update(patch)
      .eq("id", row.id)
      .in("status", UNFINISHED)
      .select("id");
    if (error) {
      report.errors.push(`close ${row.id}: ${error.message}`);
      continue;
    }
    if (!changed || changed.length === 0) continue;
    if (hasImage) report.recovered += 1;
    else report.marked_failed += 1;
  }

  // ── 2. Refund failed rows that are not settled ─────────────
  // Only rows with a recorded charge: made after the ledger started,
  // or charged by a route (credits_used > 0).
  const settleBefore = new Date(now - SETTLE_DELAY_MS).toISOString();
  const { data: failedData, error: failedErr } = await db
    .from("generations")
    .select(REFUND_ROW_COLUMNS)
    .eq("status", "failed")
    .or("credits_refunded.is.null,credits_refunded.eq.false")
    .or(`created_at.gte.${ledgerStartIso},credits_used.gt.0`)
    .or(`updated_at.is.null,updated_at.lt.${settleBefore}`)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (failedErr) report.errors.push(`refund scan: ${failedErr.message}`);

  for (const row of (failedData ?? []) as unknown as RefundableRow[]) {
    if (dryRun) {
      report.waiting += 1;
      continue;
    }
    const outcome = await refundFailedGeneration(db, row, {
      reason: "sweeper_generation_failed",
      skipGrace: true,
      now,
    });
    if (outcome.kind === "refunded") {
      report.refunded_generations += 1;
      report.refunded_credits += outcome.amount;
    } else if (outcome.kind === "already_refunded" || outcome.kind === "nothing_to_refund") {
      report.already_settled += 1;
    } else if (outcome.kind === "wait") {
      report.waiting += 1;
    } else if (outcome.kind === "error") {
      report.errors.push(`refund ${row.id}: ${outcome.message}`);
    }
  }

  // Failed rows from before the ledger: nobody can tell from the data
  // whether (or how much) they were charged — count them for a person.
  const { count: legacyCount } = await db
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .or("credits_refunded.is.null,credits_refunded.eq.false")
    .lt("created_at", ledgerStartIso)
    .or("credits_used.is.null,credits_used.eq.0");
  report.legacy_unsettled = legacyCount ?? 0;

  // ── 3. Save finished images that still sit on a provider link ─
  const mirrorSince = new Date(now - MIRROR_WINDOW_MS).toISOString();
  const { data: mirrorData, error: mirrorErr } = await db
    .from("generations")
    .select(MIRROR_ROW_COLUMNS)
    .eq("status", "completed")
    .gte("created_at", mirrorSince)
    // original_provider_url is filled once a row was handled (copied,
    // or found to be gone) — so a dead link is tried only once.
    .is("original_provider_url", null)
    .or("output_url.ilike.%fal.media%,output_image_url.ilike.%fal.media%,image_url.ilike.%fal.media%")
    .order("created_at", { ascending: false })
    .limit(MIRROR_BATCH);
  if (mirrorErr) report.errors.push(`image scan: ${mirrorErr.message}`);

  for (const row of (mirrorData ?? []) as unknown as MirrorableRow[]) {
    if (dryRun) {
      report.images_saved += 1;
      continue;
    }
    const result = await mirrorProviderImage(db, row);
    if (result.ok && result.changed) {
      report.images_saved += 1;
    } else if (!result.ok && result.gone) {
      report.images_gone += 1;
      await db
        .from("generations")
        .update({ original_provider_url: row.output_url || row.output_image_url || row.image_url })
        .eq("id", row.id);
    } else if (!result.ok) {
      report.errors.push(`image ${row.id}: ${result.message}`);
    }
  }

  if (report.errors.length > 0) {
    console.error("[generation-sweeper]", report.errors.join(" | "));
  }
  return NextResponse.json({ success: report.errors.length === 0, ...report });
}
