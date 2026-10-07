// POST /api/careers/influencer/lookup
// Creator login. Body: { email, mobile }
//
// The person gives the email AND the mobile number they registered
// with; on a match they get a signed session token
// (lib/influencerSession.ts), which is what the creator APIs check.
// Attempts are rate-limited and a miss never says which of the two
// was wrong.

import { NextRequest, NextResponse } from "next/server";

import { serviceDb } from "@/lib/creditsServer";
import { rateLimit } from "@/lib/rateLimit";
import { issueInfluencerToken, mobileKey } from "@/lib/influencerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_MATCH =
  "We could not match these details. Use the email and mobile number you applied with, or apply first.";

/** Escape % and _ so the email is matched literally by ILIKE. */
const likeLiteral = (value: string) => value.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { name: "influencer-login", limit: 8, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const mobile = mobileKey(body?.mobile);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return NextResponse.json({ ok: false, error: "Please enter your registered email." }, { status: 400 });
    }
    if (!mobile) {
      return NextResponse.json(
        { ok: false, error: "Please enter your registered 10-digit mobile number." },
        { status: 400 },
      );
    }

    const { data: rows, error } = await serviceDb()
      .from("candidates")
      .select("id, name, stage, mobile, created_at")
      .ilike("email", likeLiteral(email))
      .eq("role_slug", "content-creator")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ ok: false, error: "Server error. Please try again." }, { status: 500 });
    }

    const candidate = (rows ?? []).find((row) => mobileKey(row.mobile) === mobile);
    if (!candidate) {
      return NextResponse.json({ ok: false, error: NO_MATCH }, { status: 404 });
    }

    if (candidate.stage === "rejected") {
      return NextResponse.json({
        ok: false,
        error: "Your application was not approved at this time. Please contact us if you think this is a mistake.",
      }, { status: 403 });
    }

    const token = issueInfluencerToken(candidate.id);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Server is not configured." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, cid: candidate.id, name: candidate.name, token });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error. Please try again." }, { status: 500 });
  }
}
