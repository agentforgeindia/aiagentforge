// POST /api/scene/edit
// Charges 1 credit per element change, then applies a single edit to
// the scene via OpenAI (gpt-image-1) while preserving the product.
// Refunds the credit if the edit fails.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { deductCredits, refundCredits } from "@/lib/creditsServer";
import { editScene, SCENE_CREDIT_COST } from "@/lib/sceneEditor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  const body = await req.json().catch(() => ({}));
  const imageUrl: string | undefined = body?.image_url || undefined;
  const imageB64: string | undefined = body?.image_b64 || undefined;
  const referenceUrl: string | undefined = body?.reference_url || undefined;
  const referenceB64: string | undefined = body?.reference_b64 || undefined;
  const instruction: string = (body?.instruction || "").trim();

  if (!imageUrl && !imageB64)
    return NextResponse.json({ error: "image_url or image_b64 is required." }, { status: 400 });
  if (!instruction)
    return NextResponse.json({ error: "instruction is required." }, { status: 400 });

  const cost = SCENE_CREDIT_COST.change;

  const deduct = await deductCredits(user.id, cost, "scene_editor_change");
  if (!deduct.ok) {
    if (deduct.reason === "insufficient")
      return NextResponse.json(
        { error: "Not enough credits.", code: "INSUFFICIENT_CREDITS" },
        { status: 402 },
      );
    return NextResponse.json(
      { error: deduct.message || "Credit deduction failed." },
      { status: 500 },
    );
  }

  const result = await editScene({
    imageUrl,
    imageB64,
    instruction,
    referenceUrl,
    referenceB64,
  });
  if (!result.ok) {
    await refundCredits(user.id, cost, "refund:scene_editor_change_failed");
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    image_b64: `data:image/png;base64,${result.b64}`,
    charged: cost,
    new_balance: deduct.newBalance,
  });
}
