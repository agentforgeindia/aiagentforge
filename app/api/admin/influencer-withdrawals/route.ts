// /api/admin/influencer-withdrawals
//   GET  — list all withdrawal requests (admin only, service role)
//   POST — act on a request: { id, action: "mark_paid" | "reject" | "retry", note? }
//
// Auto-payouts fire from the influencer withdraw endpoint. This admin
// surface is for monitoring + manual settlement / retry when RazorpayX
// is not configured or a payout failed.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createUpiPayout, isRazorpayXConfigured } from "@/lib/razorpayx";

export const runtime = "nodejs";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  const { data } = await db.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await db.from("admin_users").select("email").eq("email", email).maybeSingle();
  return !!row;
}

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization")))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await db
    .from("influencer_withdrawals")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Enrich with creator name/email
  const ids = Array.from(new Set((data ?? []).map(w => w.candidate_id).filter(Boolean)));
  let nameMap: Record<string, { name: string; email: string; mobile: string }> = {};
  if (ids.length) {
    const { data: cands } = await db.from("candidates").select("id, name, email, mobile").in("id", ids);
    nameMap = Object.fromEntries((cands ?? []).map(c => [c.id, { name: c.name, email: c.email, mobile: c.mobile }]));
  }

  const rows = (data ?? []).map(w => ({ ...w, creator: nameMap[w.candidate_id] ?? null }));
  return NextResponse.json({ ok: true, rows, razorpayx: isRazorpayXConfigured() });
}

export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization")))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id, action, note } = await req.json();
  if (!id || !action) {
    return NextResponse.json({ ok: false, error: "Missing id or action." }, { status: 400 });
  }

  const { data: w } = await db.from("influencer_withdrawals").select("*").eq("id", id).maybeSingle();
  if (!w) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  if (action === "mark_paid") {
    await db.from("influencer_withdrawals")
      .update({ status: "paid", processed_at: new Date().toISOString(), admin_note: note ?? null })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await db.from("influencer_withdrawals")
      .update({ status: "rejected", processed_at: new Date().toISOString(), admin_note: note ?? null })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "retry") {
    if (!isRazorpayXConfigured()) {
      return NextResponse.json({ ok: false, error: "RazorpayX is not configured." }, { status: 400 });
    }
    if (!w.upi_id) {
      return NextResponse.json({ ok: false, error: "No UPI on file for this request." }, { status: 400 });
    }
    const { data: cand } = await db.from("candidates").select("name, email, mobile").eq("id", w.candidate_id).maybeSingle();
    try {
      const payout = await createUpiPayout({
        name: cand?.name ?? "AgentForge Creator",
        email: cand?.email ?? null,
        phone: cand?.mobile ?? null,
        upi: w.upi_id,
        amountRupees: Number(w.amount),
        referenceId: w.id,
        narration: "AgentForge payout",
      });
      await db.from("influencer_withdrawals").update({
        payout_id: payout.payout_id,
        contact_id: payout.contact_id,
        fund_account_id: payout.fund_account_id,
        payout_mode: payout.mode,
        status: payout.status === "processed" ? "paid" : "processing",
        processed_at: payout.status === "processed" ? new Date().toISOString() : null,
        failure_reason: null,
      }).eq("id", id);
      return NextResponse.json({ ok: true, payout_status: payout.status });
    } catch (e: any) {
      await db.from("influencer_withdrawals").update({ status: "failed", failure_reason: e?.message ?? "payout failed" }).eq("id", id);
      return NextResponse.json({ ok: false, error: e?.message ?? "Payout failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
