// POST /api/careers/apply  (PUBLIC)
// Candidate applies. Find-or-create by mobile.
// Content-creator: saves social links + triggers AI analysis.

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

const MAX_ATTEMPTS = 3;

function analyseContentCreator(links: { instagram_url?: string; youtube_url?: string; facebook_url?: string; other_url?: string; followers_count?: string; avg_views?: string; niche?: string }) {
  let score = 0;
  const profileCount = [links.instagram_url, links.youtube_url, links.facebook_url, links.other_url].filter(Boolean).length;
  score += profileCount * 10;

  const followers = parseInt((links.followers_count ?? "0").replace(/[^0-9]/g, "")) || 0;
  if (followers >= 100000) score += 40;
  else if (followers >= 10000) score += 25;
  else if (followers >= 1000) score += 10;

  const views = parseInt((links.avg_views ?? "0").replace(/[^0-9]/g, "")) || 0;
  if (views >= 50000) score += 30;
  else if (views >= 5000) score += 15;
  else if (views >= 500) score += 5;

  if (links.niche) score += 5;
  score = Math.min(100, score);
  const ai_verdict = score >= 60 ? "strong_influencer" : score >= 30 ? "moderate" : "not_fit";
  return { ai_score: score, ai_verdict };
}

function generateReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `AF${base}${rand}`;
}

export async function POST(req: Request) {
  const b      = await req.json().catch(() => ({}));
  const name   = String(b.name ?? "").trim();
  const mobile = String(b.mobile ?? "").replace(/[^\d+]/g, "");
  if (!name || mobile.length < 8) {
    return NextResponse.json({ error: "Name and a valid mobile number are required." }, { status: 400 });
  }

  const db = svc();

  const { data: existing } = await db.from("candidates").select("id, stage").eq("mobile", mobile).maybeSingle();

  let candidateId: string;
  if (existing) {
    candidateId = existing.id;
    await db.from("candidates").update({
      name, email: b.email || null, city: b.city || null, state: b.state || null,
      role_slug: b.role_slug || null, updated_at: new Date().toISOString(),
    }).eq("id", candidateId);
  } else {
    const { data: created, error } = await db.from("candidates").insert({
      name, mobile, email: b.email || null, city: b.city || null, state: b.state || null,
      role_slug: b.role_slug || null, source: "portal", stage: "applied",
    }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    candidateId = created.id;
  }

  // Content Creator: save social links + AI analysis
  if (b.role_slug === "content-creator" && b.social_links) {
    const { ai_score, ai_verdict } = analyseContentCreator(b.social_links);
    const referral_code = generateReferralCode(name);

    await db.from("content_creator_social").delete().eq("candidate_id", candidateId);
    await db.from("content_creator_social").insert({
      candidate_id:   candidateId,
      instagram_url:  b.social_links.instagram_url || null,
      youtube_url:    b.social_links.youtube_url || null,
      facebook_url:   b.social_links.facebook_url || null,
      other_url:      b.social_links.other_url || null,
      followers_count: b.social_links.followers_count || null,
      avg_views:      b.social_links.avg_views || null,
      niche:          b.social_links.niche || null,
      ai_score, ai_verdict,
      referral_code,
      referral_status: ai_score >= 50 ? "offered" : "pending",
    });

    try {
      await db.from("recruitment_notifications").insert({
        candidate_id: candidateId, candidate_name: name,
        role_slug: "content-creator",
        event_type: "content_creator_applied",
        total_score: ai_score,
        details: { ai_verdict, referral_code, followers: b.social_links.followers_count },
      });
    } catch {}
  }

  const { count } = await db.from("assessment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidateId);
  const used = count ?? 0;

  return NextResponse.json({
    ok: true,
    candidate_id: candidateId,
    attempts_used: used,
    attempts_left: Math.max(0, MAX_ATTEMPTS - used),
    locked: used >= MAX_ATTEMPTS,
  });
}
