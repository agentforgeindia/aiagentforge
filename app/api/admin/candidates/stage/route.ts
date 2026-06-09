// POST /api/admin/candidates/stage
// 1. Updates candidate stage.
// 2. Inserts a candidate_notification so frontend dashboard shows a toast.
// 3. If role=content-creator AND stage = selected/offer_accepted/hired
//    → upsert content_creator_social so they appear in Influencer Hub.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function generateReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5);
  const rand  = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `AF${base}${rand}`;
}

// Stages that get a candidate-facing notification
const NOTIFY_MAP: Record<string, { title: string; body: string }> = {
  selected:         { title: "🎉 You've been selected!", body: "Congratulations! Our team has selected you. We will be in touch with the next steps shortly." },
  offer_sent:       { title: "📨 Offer letter sent!", body: "An offer has been sent to you. Please check your email and respond." },
  offer_accepted:   { title: "✅ Offer confirmed!", body: "Your offer has been confirmed. Welcome to the team — next steps coming soon!" },
  hired:            { title: "🚀 You're Hired! Welcome aboard!", body: "You are now officially part of AgentForge. Our team will contact you for onboarding." },
  interview_scheduled: { title: "📅 Interview Scheduled", body: "Your interview has been scheduled. Please check your email or WhatsApp for the details." },
  rejected:         { title: "Application Update", body: "Thank you for your interest in AgentForge. Unfortunately, we won't be moving forward at this time. We wish you the best!" },
  talent_pool:      { title: "🌟 Added to Talent Pool", body: "You've been added to our talent pool for future opportunities. We will reach out when a suitable role opens up." },
};

const INFLUENCER_STAGES = new Set(["selected", "offer_accepted", "hired"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidate_id, stage, changed_by } = body;
    if (!candidate_id || !stage) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    // 1. Fetch candidate info (needed for notification + influencer sync)
    const { data: cand } = await db
      .from("candidates")
      .select("id, name, email, mobile, role_slug, stage")
      .eq("id", candidate_id)
      .maybeSingle();

    if (!cand) return NextResponse.json({ ok: false, error: "Candidate not found" }, { status: 404 });

    // 2. Update stage
    const { error: stageErr } = await db
      .from("candidates")
      .update({ stage, updated_at: new Date().toISOString() })
      .eq("id", candidate_id);
    if (stageErr) throw stageErr;

    // 2b. Write stage log (also written by DB trigger, but explicit here for changed_by)
    try {
      await db.from("candidate_stage_log").insert({
        candidate_id,
        stage,
        changed_by: changed_by ?? "admin",
      });
    } catch {}

    // 3. Insert candidate-facing notification if this stage has a message
    const notif = NOTIFY_MAP[stage];
    if (notif) {
      try {
        await db.from("candidate_notifications").insert({
          candidate_id,
          type:  "stage_update",
          title: notif.title,
          body:  notif.body,
          stage,
        });
      } catch {}
    }

    // 4. Content-creator → auto-sync influencer hub record
    if (INFLUENCER_STAGES.has(stage) && cand.role_slug === "content-creator") {
      const { data: existing } = await db
        .from("content_creator_social")
        .select("id, referral_code, referral_status")
        .eq("candidate_id", candidate_id)
        .maybeSingle();

      let finalCode: string;

      if (!existing) {
        let code = generateReferralCode(cand.name);
        const { data: clash } = await db
          .from("content_creator_social").select("id").eq("referral_code", code).maybeSingle();
        if (clash) code = generateReferralCode(cand.name + Date.now());

        await db.from("content_creator_social").insert({
          candidate_id,
          referral_code:   code,
          referral_status: "active",
          ai_score:        50,
          ai_verdict:      "admin_approved",
        });
        finalCode = code;
      } else {
        if (existing.referral_status !== "active") {
          await db.from("content_creator_social")
            .update({ referral_status: "active" })
            .eq("candidate_id", candidate_id);
        }
        finalCode = existing.referral_code;
      }

      // ── CRITICAL: Sync influencer referral code → profiles.referral_code ──
      // This makes process_referral() work when new users sign up via
      // ?ref=<influencer_code> — without this, signups are never attributed.
      if (finalCode && cand.email) {
        try {
          await db
            .from("profiles")
            .update({ referral_code: finalCode })
            .eq("email", cand.email);
        } catch {}
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
