import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/careers/influencer/lookup
// Body: { email }
// Returns: { ok, cid, name } — used by content creators to access their dashboard
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Email required." }, { status: 400 });
    }

    // Find by email + role_slug = content-creator (any stage is fine)
    const { data: candidate, error } = await admin
      .from("candidates")
      .select("id, name, stage, role_slug")
      .ilike("email", email.trim())
      .eq("role_slug", "content-creator")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !candidate) {
      return NextResponse.json({
        ok: false,
        error: "No content creator account found with this email. Please check and try again, or apply first.",
      }, { status: 404 });
    }

    // Rejected candidates — show a helpful message
    if (candidate.stage === "rejected") {
      return NextResponse.json({
        ok: false,
        error: "Your application was not approved at this time. Please contact us if you think this is a mistake.",
      }, { status: 403 });
    }

    return NextResponse.json({ ok: true, cid: candidate.id, name: candidate.name });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error. Please try again." }, { status: 500 });
  }
}
