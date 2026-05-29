// ============================================================
// /api/trendforge/generate  — HARDENED (Pillar 5)
// ============================================================
// Previously: trusted body.user_id, no auth, no atomic credit
// deduction. Anyone could spam this with another user's UUID.
//
// Now:
//   1. Require Authorization: Bearer <jwt>.
//   2. Validate image_url is AgentForge-hosted.
//   3. Atomically deduct credits server-side; refund on n8n fail.
// ============================================================

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { deductCredits, refundCredits } from "@/lib/creditsServer";
import { isAgentForgeHostedUrl } from "@/lib/uploadValidation";

export const runtime = "nodejs";

const MAX_CREDITS_PER_CALL = 500;

export async function POST(request: Request) {
  // 1. Auth.
  const userOrResp = await requireUser(request);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  // 2. Parse + validate body.
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isAgentForgeHostedUrl(body?.image_url)) {
    return NextResponse.json(
      { success: false, error: "image_url must be an AgentForge-hosted URL." },
      { status: 400 },
    );
  }
  if (typeof body?.trend_id !== "string" || typeof body?.hidden_prompt !== "string") {
    return NextResponse.json(
      { success: false, error: "trend_id and hidden_prompt required." },
      { status: 400 },
    );
  }

  const credits = Number(body?.credits ?? 17);
  if (!Number.isFinite(credits) || credits <= 0 || credits > MAX_CREDITS_PER_CALL) {
    return NextResponse.json(
      {
        success: false,
        error: `credits must be a positive integer ≤ ${MAX_CREDITS_PER_CALL}.`,
      },
      { status: 400 },
    );
  }

  const webhookUrl =
    process.env.N8N_TRENDFORGE_WEBHOOK_URL ||
    process.env.N8N_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_N8N_TRENDFORGE_WEBHOOK ||
    process.env.NEXT_PUBLIC_N8N_GENERATE_WEBHOOK;

  if (!webhookUrl) {
    return NextResponse.json(
      { success: false, error: "TrendForge webhook URL is not configured." },
      { status: 500 },
    );
  }

  // 3. Atomic deduction.
  const deduct = await deductCredits(
    user.id,
    credits,
    "trendforge_generate",
    body.trend_id,
  );
  if (!deduct.ok) {
    if (deduct.reason === "insufficient") {
      return NextResponse.json(
        { success: false, error: "Not enough credits.", code: "INSUFFICIENT_CREDITS" },
        { status: 402 },
      );
    }
    return NextResponse.json(
      { success: false, error: deduct.message || "Credit deduction failed." },
      { status: 500 },
    );
  }

  // 4. Forward to n8n with verified user_id.
  let n8nResponse: Response;
  try {
    n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generation_type: "trendforge",
        user_id: user.id,
        image_url: body.image_url,
        trend_id: body.trend_id,
        trend_name: body.trend_name,
        trend_category: body.trend_category,
        hidden_prompt: body.hidden_prompt,
        credits,
      }),
    });
  } catch (err: any) {
    await refundCredits(user.id, credits, "refund:trendforge_n8n_unreachable", body.trend_id);
    return NextResponse.json(
      { success: false, error: err?.message || "n8n unreachable." },
      { status: 502 },
    );
  }

  const data = await n8nResponse.json().catch(() => ({}));

  if (!n8nResponse.ok) {
    await refundCredits(user.id, credits, "refund:trendforge_n8n_error", body.trend_id);
    return NextResponse.json(
      { success: false, error: data?.error || "n8n TrendForge workflow failed." },
      { status: n8nResponse.status },
    );
  }

  return NextResponse.json({
    success: true,
    image_url: data?.image_url || data?.output_url || data?.result?.image_url || "",
    output_url: data?.output_url || data?.image_url || "",
    generation_id: data?.generation_id || data?.id || null,
    new_balance: deduct.newBalance,
  });
}
