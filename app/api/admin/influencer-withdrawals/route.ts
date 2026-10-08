// /api/admin/influencer-withdrawals
//   GET  — list all withdrawal requests (admin only, service role)
//   POST — act on a request: { id, action: "mark_paid" | "reject" | "retry", note? }
//
// A creator can only REQUEST a withdrawal. Money leaves only from
// here, when a team member with the affiliates.manage permission
// approves it ("Pay via UPI" → RazorpayX) or settles it by hand and
// clicks "Mark Paid". Every action is written to the admin audit log.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createUpiPayout, isRazorpayXConfigured } from "@/lib/razorpayx";
import { adminFromAuthHeader, auditAdminAction, type PermissionSpec } from "@/lib/adminAuth";

export const runtime = "nodejs";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Valid login + ACTIVE admin + the permission for this screen/action
// (lib/adminAuth.ts). Being listed in admin_users alone is not enough.
async function isAdmin(
  authHeader: string | null,
  perm: PermissionSpec = "finance.view",
): Promise<boolean> {
  return Boolean(await adminFromAuthHeader(authHeader, perm));
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
  // Paying, retrying or rejecting a payout moves real money — it needs
  // the affiliates.manage permission, not just access to the screen.
  const admin = await adminFromAuthHeader(req.headers.get("authorization"), "affiliates.manage");
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Your role does not include the affiliates.manage permission." },
      { status: 403 },
    );
  }

  const { id, action, note } = await req.json().catch(() => ({}));
  if (!id || !action) {
    return NextResponse.json({ ok: false, error: "Missing id or action." }, { status: 400 });
  }

  const { data: w } = await db.from("influencer_withdrawals").select("*").eq("id", id).maybeSingle();
  if (!w) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const audit = (outcome: string, extra: Record<string, unknown> = {}) =>
    auditAdminAction(admin, `influencer_withdrawal.${action}`, { type: "influencer_withdrawal", id: String(id) }, {
      outcome,
      amount: Number(w.amount),
      candidate_id: w.candidate_id,
      status_before: w.status,
      ...extra,
    });

  // Each action is only valid from certain states, and the state change
  // is a conditional update — so two clicks (or two admins) can never
  // pay or close the same request twice.
  if (action === "mark_paid") {
    const { data: done } = await db.from("influencer_withdrawals")
      .update({ status: "paid", processed_at: new Date().toISOString(), admin_note: note ?? null })
      .eq("id", id)
      .in("status", ["requested", "processing", "failed"])
      .select("id");
    if (!done?.length) {
      return NextResponse.json({ ok: false, error: `This request is already ${w.status}.` }, { status: 409 });
    }
    await audit("marked_paid");
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    // A payout that is already on its way cannot be rejected here.
    const { data: done } = await db.from("influencer_withdrawals")
      .update({ status: "rejected", processed_at: new Date().toISOString(), admin_note: note ?? null })
      .eq("id", id)
      .in("status", ["requested", "failed"])
      .select("id");
    if (!done?.length) {
      return NextResponse.json({ ok: false, error: `This request is ${w.status} and cannot be rejected.` }, { status: 409 });
    }
    await audit("rejected");
    return NextResponse.json({ ok: true });
  }

  // "retry" = approve and pay by UPI (first payment or after a failure).
  if (action === "retry" || action === "approve") {
    if (!isRazorpayXConfigured()) {
      return NextResponse.json({ ok: false, error: "RazorpayX is not configured." }, { status: 400 });
    }
    if (!w.upi_id) {
      return NextResponse.json({ ok: false, error: "No UPI on file for this request." }, { status: 400 });
    }
    // Claim the request first: only one caller moves it to "processing".
    const { data: claimed } = await db.from("influencer_withdrawals")
      .update({ status: "processing", failure_reason: null })
      .eq("id", id)
      .in("status", ["requested", "failed"])
      .select("id");
    if (!claimed?.length) {
      return NextResponse.json({ ok: false, error: `This request is already ${w.status}.` }, { status: 409 });
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
      await audit("payout_created", { payout_id: payout.payout_id, payout_status: payout.status });
      return NextResponse.json({ ok: true, payout_status: payout.status });
    } catch (e: any) {
      await db.from("influencer_withdrawals").update({ status: "failed", failure_reason: e?.message ?? "payout failed" }).eq("id", id);
      await audit("payout_failed", { error: e?.message ?? "payout failed" });
      return NextResponse.json({ ok: false, error: e?.message ?? "Payout failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
