// GET /api/admin/crm-dashboard — aggregated CRM/sales metrics from the
// deals table for the modern CRM dashboard. Admin-only (service role).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  const { data } = await db.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await db
    .from("admin_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  return !!row;
}

type Deal = {
  value_inr: number | null;
  stage: string;
  probability: number | null;
  assigned_to: string | null;
  close_date: string | null;
  created_at: string;
};

const OPEN_STAGES = [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
];

export async function GET(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization"))))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await db
    .from("deals")
    .select("value_inr, stage, probability, assigned_to, close_date, created_at")
    .limit(10000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const deals = (data ?? []) as Deal[];
  const val = (d: Deal) => Number(d.value_inr) || 0;
  const isOpen = (d: Deal) => OPEN_STAGES.includes(d.stage);

  const won = deals.filter((d) => d.stage === "closed_won");
  const lost = deals.filter((d) => d.stage === "closed_lost");
  const open = deals.filter(isOpen);
  const closedTotal = won.length + lost.length;

  const sum = (arr: Deal[]) => arr.reduce((s, d) => s + val(d), 0);

  const kpis = {
    total_deals: deals.length,
    pipeline_value: sum(open),
    won_value: sum(won),
    open_deals: open.length,
    won_deals: won.length,
    lost_deals: lost.length,
    win_rate: closedTotal ? (won.length / closedTotal) * 100 : 0,
    weighted_value: open.reduce(
      (s, d) => s + val(d) * ((Number(d.probability) || 0) / 100),
      0,
    ),
    avg_deal_value: won.length ? sum(won) / won.length : 0,
  };

  // By stage (for the donut)
  const STAGES = [
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ];
  const byStage = STAGES.map((stage) => {
    const rows = deals.filter((d) => d.stage === stage);
    return { stage, count: rows.length, value: sum(rows) };
  });

  // By owner (for the team table)
  const owners = new Map<string, Deal[]>();
  for (const d of deals) {
    const o = d.assigned_to?.trim() || "Unassigned";
    if (!owners.has(o)) owners.set(o, []);
    owners.get(o)!.push(d);
  }
  const byOwner = [...owners.entries()]
    .map(([owner, rows]) => {
      const w = rows.filter((d) => d.stage === "closed_won");
      const l = rows.filter((d) => d.stage === "closed_lost");
      const o = rows.filter(isOpen);
      const closed = w.length + l.length;
      return {
        owner,
        deals: rows.length,
        open: o.length,
        won: w.length,
        lost: l.length,
        value: sum(rows),
        won_value: sum(w),
        win_rate: closed ? (w.length / closed) * 100 : 0,
      };
    })
    .sort((a, b) => b.won_value - a.won_value);

  // Monthly won trend (last 8 months)
  const months: { key: string; label: string; won_value: number; won_count: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`,
      label: dt.toLocaleDateString("en-IN", { month: "short" }),
      won_value: 0,
      won_count: 0,
    });
  }
  const monthIdx = new Map(months.map((m, i) => [m.key, i]));
  for (const d of won) {
    const ref = d.close_date || d.created_at;
    const dt = new Date(ref);
    if (isNaN(dt.getTime())) continue;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const idx = monthIdx.get(key);
    if (idx !== undefined) {
      months[idx].won_value += val(d);
      months[idx].won_count += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    kpis,
    byStage,
    byOwner,
    monthly: months,
  });
}
