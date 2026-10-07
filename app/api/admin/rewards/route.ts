// GET /api/admin/rewards — everything the Refer & Rewards page shows.
// Needs the customers.view permission (checked on the server).
//
//   referrals   who referred whom, with the credits given
//   unrewarded  sign-ups that carry a referral code but got no credits
//   feedback    the latest rating / feedback rewards
//   tx          every reward credit entry (for totals per period)
//
// Read-only. Sources: public.referrals, profiles.referred_by,
// public.feedback, public.credit_transactions (reasons in
// lib/referral.ts REWARD_REASONS), payments (did the friend pay).

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireAdminPermission } from "@/lib/adminAuth";
import { REWARD_REASONS, REWARD_RULES } from "@/lib/referral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = 1000;
const MAX_PAGES = 20;
const FEEDBACK_LIMIT = 300;

type Person = { id: string; email: string | null; name: string | null; code: string | null };

/** Reads a whole (filtered) table, 1,000 rows at a time. */
async function readAll<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await fetchPage(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw new Error(error.message);
    const batch = (data as T[] | null) ?? [];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

async function peopleById(db: SupabaseClient, ids: string[]): Promise<Map<string, Person>> {
  const map = new Map<string, Person>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  for (let i = 0; i < unique.length; i += 200) {
    const { data } = await db
      .from("profiles")
      .select("id, email, full_name, referral_code")
      .in("id", unique.slice(i, i + 200));
    for (const p of (data ?? []) as { id: string; email: string | null; full_name: string | null; referral_code: string | null }[]) {
      map.set(p.id, { id: p.id, email: p.email, name: p.full_name, code: p.referral_code });
    }
  }
  return map;
}

export async function GET(req: Request) {
  const admin = await requireAdminPermission(req, "customers.view");
  if (admin instanceof Response) return admin;
  const db = admin.db;

  try {
    type ReferralRow = { id: string; referrer_id: string; referred_id: string; credits_awarded: number | null; created_at: string };
    type ReferredProfile = { id: string; email: string | null; full_name: string | null; referred_by: string; created_at: string | null };
    type TxRow = { user_id: string; delta: number | null; reason: string; created_at: string };
    type FeedbackRow = {
      id: string; user_id: string; rating: number; feedback: string | null;
      credits_awarded: number | null; agent: string | null; created_at: string;
    };

    const [referrals, referred, tx, feedbackRes, creators] = await Promise.all([
      readAll<ReferralRow>((from, to) =>
        db.from("referrals").select("id, referrer_id, referred_id, credits_awarded, created_at").order("created_at", { ascending: false }).range(from, to),
      ),
      readAll<ReferredProfile>((from, to) =>
        db.from("profiles").select("id, email, full_name, referred_by, created_at").not("referred_by", "is", null).order("created_at", { ascending: false }).range(from, to),
      ),
      readAll<TxRow>((from, to) =>
        db.from("credit_transactions").select("user_id, delta, reason, created_at").in("reason", Object.values(REWARD_REASONS)).order("created_at", { ascending: false }).range(from, to),
      ),
      db.from("feedback").select("id, user_id, rating, feedback, credits_awarded, agent, created_at").order("created_at", { ascending: false }).limit(FEEDBACK_LIMIT),
      db.from("content_creator_social").select("referral_code"),
    ]);

    const feedback = (feedbackRes.data ?? []) as FeedbackRow[];
    const creatorCodes = new Set(
      ((creators.data ?? []) as { referral_code: string | null }[]).map((c) => (c.referral_code ?? "").toUpperCase()).filter(Boolean),
    );

    const people = await peopleById(db, [
      ...referrals.flatMap((r) => [r.referrer_id, r.referred_id]),
      ...feedback.map((f) => f.user_id),
    ]);
    const anon = (id: string): Person => people.get(id) ?? { id, email: null, name: null, code: null };

    // Which referred friends became paying customers.
    const friendIds = Array.from(new Set([...referrals.map((r) => r.referred_id), ...referred.map((p) => p.id)]));
    const paid = new Set<string>();
    for (let i = 0; i < friendIds.length; i += 200) {
      const { data } = await db.from("payments").select("user_id").eq("status", "paid").in("user_id", friendIds.slice(i, i + 200));
      for (const row of (data ?? []) as { user_id: string }[]) paid.add(row.user_id);
    }

    const friendBonus = new Set(tx.filter((t) => t.reason === REWARD_REASONS.friend).map((t) => t.user_id));

    // Sign-ups that carry a code but have no reward row.
    const rewardedFriends = new Set(referrals.map((r) => r.referred_id));
    const codeOwners = new Set<string>();
    const pendingCodes = Array.from(new Set(referred.filter((p) => !rewardedFriends.has(p.id)).map((p) => p.referred_by.toUpperCase())));
    for (let i = 0; i < pendingCodes.length; i += 200) {
      const { data } = await db.from("profiles").select("referral_code").in("referral_code", pendingCodes.slice(i, i + 200));
      for (const row of (data ?? []) as { referral_code: string }[]) codeOwners.add(row.referral_code.toUpperCase());
    }

    return NextResponse.json({
      ok: true,
      rules: REWARD_RULES,
      referrals: referrals.map((r) => ({
        id: r.id,
        at: r.created_at,
        referrer: anon(r.referrer_id),
        friend: anon(r.referred_id),
        credits: Number(r.credits_awarded) || 0,
        friendBonus: friendBonus.has(r.referred_id),
        friendPaid: paid.has(r.referred_id),
      })),
      unrewarded: referred
        .filter((p) => !rewardedFriends.has(p.id))
        .map((p) => {
          const code = p.referred_by.toUpperCase();
          return {
            friend: { id: p.id, email: p.email, name: p.full_name, code: null } satisfies Person,
            code,
            at: p.created_at,
            friendPaid: paid.has(p.id),
            // creator = a content creator's code (their commission is tracked under Influencers)
            // unknown = no account owns this code (typo or old code)
            // missed  = a customer owns the code but the credit step did not run
            why: creatorCodes.has(code) ? "creator" : codeOwners.has(code) ? "missed" : "unknown",
          };
        }),
      feedback: feedback.map((f) => ({
        id: f.id,
        at: f.created_at,
        user: anon(f.user_id),
        rating: f.rating,
        text: f.feedback ? f.feedback.slice(0, 200) : null,
        credits: Number(f.credits_awarded) || 0,
        agent: f.agent,
      })),
      feedbackLimit: FEEDBACK_LIMIT,
      tx: tx.map((t) => ({ at: t.created_at, reason: t.reason, credits: Number(t.delta) || 0 })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load rewards." }, { status: 500 });
  }
}
