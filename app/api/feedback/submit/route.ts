// ============================================================
// /api/feedback/submit
// Saves user rating/feedback and awards credits:
//   - Star rating only  → +1 credit
//   - Written feedback  → +2 credits
//   - Both              → +3 credits total
// ============================================================

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => ({}));
  const { rating, feedback, generation_id, agent } = body as {
    rating?: number;
    feedback?: string;
    generation_id?: string;
    agent?: string;
  };

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5." }, { status: 400 });
  }

  const hasFeedback = typeof feedback === "string" && feedback.trim().length > 0;
  const creditsToAdd = (rating ? 1 : 0) + (hasFeedback ? 2 : 0);

  const supabase = adminClient();

  // Prevent duplicate submissions for same generation
  if (generation_id) {
    const { data: existing } = await supabase
      .from("feedback")
      .select("id")
      .eq("user_id", user.id)
      .eq("generation_id", generation_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Feedback already submitted for this generation." },
        { status: 409 },
      );
    }
  }

  // Save feedback row
  const { error: insertError } = await supabase.from("feedback").insert({
    user_id: user.id,
    rating,
    feedback: feedback?.trim() || null,
    generation_id: generation_id || null,
    agent: agent || null,
    credits_awarded: creditsToAdd,
  });

  if (insertError) {
    console.error("[feedback/submit] insert error:", insertError.message);
    return NextResponse.json({ error: "Failed to save feedback." }, { status: 500 });
  }

  // Written feedback also becomes a PENDING testimonial — once the admin
  // approves it, it shows in the on-page reviews slider. Best-effort: a
  // failure here must not block the credit reward.
  if (hasFeedback) {
    try {
      // Prefer the profile name, fall back to the email's local part.
      const { data: prof } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();
      const name =
        (typeof prof?.name === "string" && prof.name.trim()) ||
        user.email?.split("@")[0] ||
        "AgentForge User";
      // The uploader's own profile photo (Google/OAuth avatar) so the
      // review card shows their picture instead of just initials.
      const meta = (user as any)?.user_metadata ?? {};
      const avatarUrl =
        (typeof meta.avatar_url === "string" && meta.avatar_url) ||
        (typeof meta.picture === "string" && meta.picture) ||
        null;
      await supabase.from("testimonials").insert({
        name,
        message: feedback!.trim(),
        rating,
        avatar_url: avatarUrl,
        // Show in the on-page reviews slider immediately for 4-5★ (the
        // slider filters by agent_type + status="approved"). 1-3★ wait
        // for admin review so the public slider stays positive.
        status: rating >= 4 ? "approved" : "pending",
        agent_type: agent || "textile",
        source: agent || "textile",
      });
    } catch (e) {
      console.error("[feedback/submit] testimonial insert skipped:", e);
    }
  }

  // Where should the bonus go? If this generation was paid for from a team
  // pool (the generation row carries team_id), the reward belongs to that
  // same team pool — not the member's personal balance. Otherwise it goes
  // to the logged-in user's personal credits.
  let rewardTeamId: string | null = null;
  if (generation_id) {
    const { data: genRow } = await supabase
      .from("generations")
      .select("team_id")
      .eq("id", generation_id)
      .maybeSingle();
    rewardTeamId = (genRow?.team_id as string | null) ?? null;
  }

  if (rewardTeamId) {
    // Credit the team pool atomically (also writes team_credit_transactions).
    const { data: newTeamBalance, error: teamErr } = await supabase.rpc(
      "topup_team_credits",
      {
        p_team_id: rewardTeamId,
        p_actor_id: user.id,
        p_amount: creditsToAdd,
        p_reason: "feedback_reward",
      },
    );

    if (teamErr) {
      console.error("[feedback/submit] team credit reward error:", teamErr.message);
      return NextResponse.json({ error: "Credits update failed." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      creditsAwarded: creditsToAdd,
      newBalance: Number(newTeamBalance),
      credited_to: "team",
    });
  }

  // Personal reward — add credits atomically to the logged-in user.
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const newBalance = (Number(profileData.credits) || 0) + creditsToAdd;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: newBalance })
    .eq("id", user.id);

  if (updateError) {
    console.error("[feedback/submit] credits update error:", updateError.message);
    return NextResponse.json({ error: "Credits update failed." }, { status: 500 });
  }

  // Audit log
  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    delta: creditsToAdd,
    reason: "feedback_reward",
    generation_id: generation_id || null,
    balance_after: newBalance,
  });

  return NextResponse.json({
    ok: true,
    creditsAwarded: creditsToAdd,
    newBalance,
    credited_to: "personal",
  });
}
