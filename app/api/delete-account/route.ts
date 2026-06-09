import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Read Bearer token from Authorization header
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  // Verify the token and get the user
  const { data: { user }, error: userError } = await admin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Session invalid. Please login again." }, { status: 401 });
  }

  const userId = user.id;

  // Delete user data (best-effort — ignore individual errors)
  await admin.from("generations").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  // Also clean up any referral earnings linked to this user's email
  try { await admin.from("referral_earnings").delete().eq("buyer_email", user.email ?? ""); } catch {}

  // Delete auth user
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
