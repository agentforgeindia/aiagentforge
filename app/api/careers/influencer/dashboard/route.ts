// GET /api/careers/influencer/dashboard?cid=UUID
// Returns influencer dashboard data: referral code, stats, scripts, videos

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cid = searchParams.get("cid");
  if (!cid) return NextResponse.json({ ok: false, error: "Missing cid" }, { status: 400 });

  // Fetch candidate + social info
  const { data: cand } = await db
    .from("candidates")
    .select("id, name, email, mobile, stage, demo_video_url, role_slug")
    .eq("id", cid)
    .eq("role_slug", "content-creator")
    .maybeSingle();

  if (!cand) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const { data: social } = await db
    .from("content_creator_social")
    .select("referral_code, referral_status, instagram_url, youtube_url, facebook_url, niche, followers_count, avg_views")
    .eq("candidate_id", cid)
    .maybeSingle();

  // Referral stats — signups
  const { count: signupCount } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", social?.referral_code ?? "__none__");

  // Referral stats — earnings
  const { data: earnings } = await db
    .from("referral_earnings")
    .select("commission_amount, purchase_amount, status, created_at, order_id")
    .eq("referral_code", social?.referral_code ?? "__none__")
    .order("created_at", { ascending: false });

  // Recent signups via this referral
  const { data: signups } = await db
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("referred_by", social?.referral_code ?? "__none__")
    .order("created_at", { ascending: false })
    .limit(20);

  // Active scripts from admin
  const { data: scripts } = await db
    .from("influencer_scripts")
    .select("id, title, description, script_text, video_ref, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10);

  // Influencer's video submissions
  const { data: videos } = await db
    .from("influencer_video_submissions")
    .select("id, script_id, video_url, platform, caption, status, admin_note, created_at, is_pinned, view_count")
    .eq("candidate_id", cid)
    .order("created_at", { ascending: false });

  // Video engagement stats (reactions + comments per video)
  const videoIds = (videos ?? []).map(v => v.id);
  const [reactionsRes, vCommentsRes] = await Promise.all([
    videoIds.length
      ? db.from("influencer_video_reactions").select("video_id, reaction_type").in("video_id", videoIds)
      : { data: [] },
    videoIds.length
      ? db.from("influencer_video_comments").select("video_id").in("video_id", videoIds)
      : { data: [] },
  ]);

  const totalEarnings = (earnings ?? []).reduce((s, r) => s + (r.commission_amount ?? 0), 0);
  const totalPurchases = (earnings ?? []).length;

  // Withdrawals — for the "Withdraw" button + available balance.
  const { data: withdrawals } = await db
    .from("influencer_withdrawals")
    .select("id, amount, status, requested_at, processed_at")
    .eq("candidate_id", cid)
    .order("requested_at", { ascending: false });

  const withdrawnTotal = (withdrawals ?? [])
    .filter(w => ["requested", "processing", "paid"].includes(w.status))
    .reduce((s, w) => s + (w.amount ?? 0), 0);
  const availableBalance = Math.max(0, totalEarnings - withdrawnTotal);
  const pendingWithdrawal = (withdrawals ?? []).find(w =>
    ["requested", "processing"].includes(w.status)
  ) ?? null;

  const referralLink = social?.referral_code
    ? `https://aiagentforge.in/?ref=${social.referral_code}`
    : null;

  // Build per-video engagement map
  const videoEngagement: Record<string, { reactions: Record<string, number>; comments: number; views: number }> = {};
  for (const v of videos ?? []) {
    const rList = (reactionsRes.data ?? []).filter(r => r.video_id === v.id);
    const cCount = (vCommentsRes.data ?? []).filter(c => c.video_id === v.id).length;
    const reactionCounts: Record<string, number> = {};
    for (const r of rList) reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] ?? 0) + 1;
    videoEngagement[v.id] = { reactions: reactionCounts, comments: cCount, views: v.view_count ?? 0 };
  }

  return NextResponse.json({
    ok: true,
    candidate: cand,
    social,
    referral_link: referralLink,
    stats: {
      signups: signupCount ?? 0,
      purchases: totalPurchases,
      earnings: totalEarnings,
    },
    available_balance: availableBalance,
    withdrawals: withdrawals ?? [],
    pending_withdrawal: pendingWithdrawal,
    signup_list: signups ?? [],
    purchase_list: earnings ?? [],
    scripts: scripts ?? [],
    videos: videos ?? [],
    video_engagement: videoEngagement,
  });
}
