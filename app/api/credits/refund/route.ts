// ============================================================
// /api/credits/refund  — server-gated refund flow
// ============================================================
// The client polls generations.status. If a row goes "failed"
// (because n8n's worker died after our route returned 200), the
// client posts here with the generation_id and the credit count.
//
// We refund ONLY IF:
//   • The JWT-verified user owns the generation row, AND
//   • status = 'failed', AND
//   • No prior refund exists for this generation_id (idempotency).
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/serverAuth";
import { refundCredits } from "@/lib/creditsServer";

export const runtime = "nodejs";

const MAX_REFUND_PER_CALL = 5_000;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: Request) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const generationId = typeof body?.generation_id === "string" ? body.generation_id : null;
  const amount = Number(body?.amount);
  const reasonHint = typeof body?.reason === "string" ? body.reason : "generation_failed";

  if (!generationId) {
    return NextResponse.json({ error: "generation_id required." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_REFUND_PER_CALL) {
    return NextResponse.json(
      { error: `amount must be a positive integer ≤ ${MAX_REFUND_PER_CALL}.` },
      { status: 400 },
    );
  }

  const db = admin();

  // 1. Ownership + status check.
  const { data: row, error: rowErr } = await db
    .from("generations")
    .select("id, user_id, status")
    .eq("id", generationId)
    .maybeSingle();

  if (rowErr) {
    return NextResponse.json({ error: rowErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Generation not found." }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: "Not your generation." }, { status: 403 });
  }
  if (row.status !== "failed") {
    return NextResponse.json(
      { error: `Cannot refund — generation status is '${row.status}'.` },
      { status: 409 },
    );
  }

  // 2. Idempotency — any prior positive credit_transactions row
  // tied to this generation_id means we've already refunded.
  const { data: priorRefund } = await db
    .from("credit_transactions")
    .select("id")
    .eq("generation_id", generationId)
    .gt("delta", 0)
    .limit(1)
    .maybeSingle();

  if (priorRefund) {
    return NextResponse.json(
      { success: true, alreadyRefunded: true },
      { status: 200 },
    );
  }

  // 3. Refund.
  const result = await refundCredits(
    user.id,
    amount,
    `refund:${reasonHint}`,
    generationId,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message || "Refund failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    new_balance: result.newBalance,
  });
}
