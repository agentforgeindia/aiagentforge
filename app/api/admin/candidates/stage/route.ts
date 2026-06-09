// POST /api/admin/candidates/stage
// Updates candidate stage. If role=content-creator AND stage becomes
// selected/offer_accepted/hired → upsert content_creator_social record so
// the influencer automatically appears in the Influencer Hub.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function generateReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `AF${base}${rand}`;
}

const INFLUENCER_STAGES = new Set(["selected", "offer_accepted", "hired"]);

export async function POST(req: NextRequest) {
  try {
    const { candidate_id, stage } = await req.json();
    if (!candidate_id || !stage) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    // 1. Update candidate stage
    const { error: stageErr } = await db
      .from("candidates")
      .update({ stage, updated_at: new Date().toISOString() })
      .eq("id", candidate_id);
    if (stageErr) throw stageErr;

    // 2. If content-creator reaching a positive stage → auto-sync hub record
    if (INFLUENCER_STAGES.has(stage)) {
      const { data: cand } = await db
        .from("candidates")
        .select("id, name, email, mobile, role_slug")
        .eq("id", candidate_id)
        .maybeSingle();

      if (cand?.role_slug === "content-creator") {
        // Check if record already exists
        const { data: existing } = await db
          .from("content_creator_social")
          .select("id, referral_code, referral_status")
          .eq("candidate_id", candidate_id)
          .maybeSingle();

        if (!existing) {
          // Generate unique referral code
          let code = generateReferralCode(cand.name);
          // Ensure uniqueness
          const { data: clash } = await db
            .from("content_creator_social")
            .select("id")
            .eq("referral_code", code)
            .maybeSingle();
          if (clash) code = generateReferralCode(cand.name + Date.now());

          await db.from("content_creator_social").insert({
            candidate_id: cand.id,
            referral_code: code,
            referral_status: "active",
            ai_score: 50,
            ai_verdict: "admin_approved",
          });
        } else if (existing.referral_status !== "active") {
          // Re-activate if previously inactive
          await db
            .from("content_creator_social")
            .update({ referral_status: "active" })
            .eq("candidate_id", candidate_id);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
