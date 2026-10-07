// GET /api/referral/check?code=XXXX  (PUBLIC)
// Tells the sign-up screen whether a referral code exists, so a typo
// is caught before the account is made. Answers only yes / no — never
// whose code it is.
//
//   { valid: true }   a customer owns this code
//   { valid: false }  nobody does
//   { valid: null }   could not check right now (the code is still
//                     tried after sign-up)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { isReferralCodeShape, normalizeReferralCode } from "@/lib/referral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const code = normalizeReferralCode(new URL(req.url).searchParams.get("code"));
  if (!isReferralCodeShape(code)) return NextResponse.json({ valid: false });

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ valid: null });

    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.from("profiles").select("id").eq("referral_code", code).limit(1);
    if (error) return NextResponse.json({ valid: null });
    return NextResponse.json({ valid: (data ?? []).length > 0 });
  } catch {
    return NextResponse.json({ valid: null });
  }
}
