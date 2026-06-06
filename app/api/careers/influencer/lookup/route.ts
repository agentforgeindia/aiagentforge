import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/careers/influencer/lookup
// Body: { email }
// Returns: { ok, cid } — used by existing influencers to access their dashboard
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Email required." }, { status: 400 });
    }

    const { data: candidate, error } = await admin
      .from("candidates")
      .select("id, name, stage")
      .ilike("email", email.trim())
      .in("stage", ["content_creator", "influencer_active", "content_creator_applied", "shortlisted", "final"])
      .single();

    if (error || !candidate) {
      return NextResponse.json({ ok: false, error: "No influencer account found with this email." }, { status: 404 });
    }

    // Check has referral code
    const { data: social } = await admin
      .from("content_creator_social")
      .select("referral_code, referral_status")
      .eq("candidate_id", candidate.id)
      .single();

    if (!social?.referral_code) {
      return NextResponse.json({ ok: false, error: "Your application is still being reviewed. You'll receive an email once approved." }, { status: 403 });
    }

    return NextResponse.json({ ok: true, cid: candidate.id, name: candidate.name });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}
