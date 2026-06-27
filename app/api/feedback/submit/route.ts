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

  // Team-credit generations earn NO feedback bonus. If this generation was
  // paid for from a team pool (the generation row carries team_id), the user
  // gave feedback for work they didn't pay for personally — so no reward is
  // granted (neither to personal nor team). Feedback/testimonial is still
  // saved; only the credit award is suppressed.
  let isTeamGeneration = false;
  if (generation_id) {
    const { data: genRow } = await supabase
      .from("generations")
      .select("team_id")
      .eq("id", generation_id)
      .maybeSingle();
    isTeamGeneration = Boolean(genRow?.team_id);
  }

  const creditsToAdd = isTeamGeneration
    ? 0
    : (rating ? 1 : 0) + (hasFeedback ? 2 : 0);

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

  // Team-credit generation → no bonus at all. Feedback/testimonial is saved
  // above, but we award zero credits and return here.
  if (isTeamGeneration) {
    return NextResponse.json({
      ok: true,
      creditsAwarded: 0,
      credited_to: "none",
      reason: "team_generation_no_bonus",
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
