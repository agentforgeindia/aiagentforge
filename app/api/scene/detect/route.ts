// POST /api/scene/detect
// Auto-detects the changeable décor elements in a room scene.
// Charges a base credit for the standalone editor (2 = sample, 3 = upload);
// "inline" (inside the mockup flow, scene already paid) is FREE.
// Refunds the charge if detection fails.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { deductCredits, refundCredits } from "@/lib/creditsServer";
import { detectElements, SCENE_CREDIT_COST, type SceneSource } from "@/lib/sceneEditor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCES: SceneSource[] = ["sample", "upload", "inline"];

export async function POST(req: Request) {
  const userOrResp = await requireUser(req);
  if (userOrResp instanceof Response) return userOrResp;
  const user = userOrResp;

  const body = await req.json().catch(() => ({}));
  const imageUrl: string = body?.image_url || "";
  const source: SceneSource = SOURCES.includes(body?.source) ? body.source : "upload";
  if (!imageUrl)
    return NextResponse.json({ error: "image_url is required." }, { status: 400 });

  const cost = SCENE_CREDIT_COST[source];

  // Charge the base scene cost (skip when free — the inline mockup flow).
  let newBalance: number | null = null;
  if (cost > 0) {
    const deduct = await deductCredits(user.id, cost, `scene_editor_${source}`);
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
    newBalance = deduct.newBalance;
  }

  const result = await detectElements(imageUrl);
  if (!result.ok) {
    if (cost > 0)
      await refundCredits(user.id, cost, `refund:scene_editor_${source}_detect_failed`);
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    elements: result.elements,
    charged: cost,
    new_balance: newBalance,
  });
}
