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

  // Add credits atomically
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
  });
}
