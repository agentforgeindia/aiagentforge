// GET /api/admin/workshop-failed — failed/incomplete ₹99 workshop payments
// pulled live from Razorpay, with the slot resolved from order notes so the
// admin can resend the correct date's payment page. Admin only.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKSHOP_SLOTS = new Set(["20-june", "21-june", "27-june", "28-june", "1-july", "5-july", "4-july"]);

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const { data } = await db.auth.getUser(authHeader.slice(7).trim());
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await db.from("admin_users").select("email").eq("email", email).maybeSingle();
  return !!row;
}

function rzpAuth() {
  return "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
}
async function rzp(path: string): Promise<any | null> {
  try {
    const r = await fetch(`https://api.razorpay.com/v1${path}`, {
      headers: { Authorization: rzpAuth() },
      cache: "no-store",
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Recent payments (last 30 days, up to 100).
  const from = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const list = await rzp(`/payments?count=100&from=${from}`);
  if (!list?.items) return NextResponse.json({ ok: true, failed: [] });

  // ₹99 failed payments only.
  const failed = list.items.filter((p: any) => p?.status === "failed" && Number(p?.amount) === 9900);

  // Resolve slot (+ skip meetings) from each order — in parallel.
  const resolved = await Promise.all(
    failed.map(async (p: any) => {
      const order = p?.order_id ? await rzp(`/orders/${p.order_id}`) : null;
      if (order?.notes?.type === "meeting") return null; // not a workshop payment
      const slot = (order?.notes?.slot || p?.notes?.slot || "").toString().trim().toLowerCase();
      return {
        payment_id: p.id,
        email: p.email || null,
        phone: p.contact || null,
        created_at: p.created_at,
        slot: WORKSHOP_SLOTS.has(slot) ? slot : null,
      };
    }),
  );

  // People who eventually paid — exclude them (don't chase paid customers).
  const { data: paidRows } = await db
    .from("workshop_registrations")
    .select("email, phone");
  const paidEmails = new Set((paidRows ?? []).map((r) => (r.email || "").toLowerCase()).filter(Boolean));
  const paidPhones = new Set((paidRows ?? []).map((r) => (r.phone || "").replace(/\D/g, "").slice(-10)).filter(Boolean));

  // Dedupe by phone (keep latest), drop already-paid + meeting rows.
  const seen = new Set<string>();
  const out: any[] = [];
  for (const r of resolved.filter(Boolean).sort((a: any, b: any) => b.created_at - a.created_at)) {
    const phone10 = (r!.phone || "").replace(/\D/g, "").slice(-10);
    const key = phone10 || r!.email || r!.payment_id;
    if (seen.has(key)) continue;
    seen.add(key);
    if (r!.email && paidEmails.has(r!.email.toLowerCase())) continue;
    if (phone10 && paidPhones.has(phone10)) continue;
    out.push(r);
  }

  return NextResponse.json({ ok: true, failed: out });
}

// POST — manually mark a failed payment as PAID (e.g. they paid via QR
// instead). Creates a confirmed workshop_registration in the chosen slot,
// so it persists and shows in that date's group (and drops off this list).
export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const paymentId = String(body?.payment_id || "").trim();
  const slot = String(body?.slot || "").trim().toLowerCase();
  const email = body?.email ? String(body.email).trim() : null;
  const phone = body?.phone ? String(body.phone).trim() : null;
  const name = body?.name ? String(body.name).trim() : null;

  if (!WORKSHOP_SLOTS.has(slot))
    return NextResponse.json({ error: "Pick a valid workshop date first." }, { status: 400 });

  const { error } = await db.rpc("register_workshop_seat", {
    p_slot_id: slot,
    p_order_id: paymentId || `manual_${Date.now()}`,
    p_payment_id: paymentId || null,
    p_amount: 99,
    p_name: name,
    p_email: email,
    p_phone: phone,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
