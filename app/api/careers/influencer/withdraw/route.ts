import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/careers/influencer/withdraw
// Body: { cid }
export async function POST(req: NextRequest) {
  try {
    const { cid } = await req.json();
    if (!cid) return NextResponse.json({ ok: false, error: "Missing cid." }, { status: 400 });

    await admin.from("candidates").update({ stage: "withdrawn" }).eq("id", cid);
    await admin
      .from("content_creator_social")
      .update({ referral_status: "inactive" })
      .eq("candidate_id", cid);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}
