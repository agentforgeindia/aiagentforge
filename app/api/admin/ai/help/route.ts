// POST /api/admin/ai/help — AI help for admin panel users.
// Explains how to use the AgentForge admin console for the asker's role.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callLLM } from "@/lib/llm";

export const runtime = "nodejs";

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return false;
  const { data: row } = await admin.from("admin_users").select("email").eq("email", email).maybeSingle();
  return Boolean(row);
}

const HELP_SYSTEM = `
You are the AgentForge Admin Console help assistant. The user is a staff member
who needs to understand how to use the backend. Answer in simple Hinglish, short
and step-by-step. Only explain the admin console — don't make up features.

KEY MODULES & WHAT THEY DO:
- War Room / Command Center: founder dashboard — revenue, signups, alerts, goals.
- Leads: inbound prospects. Pipeline (Kanban), lead scoring (Hot/Warm/Cold).
- Sales Command: calling queue — hot leads, followups, call modal with outcome.
- Caller Reports: daily numbers (calls, demos, hot leads, paid).
- Caller GPT: type customer's words → instant ready reply.
- Sales War Room: team ranks, sales, incentives, kudos, achievers, targets.
- Customers: signed-up users, plans, balance, timeline, health score.
- Credits: balances, purchased/consumed, ledger, manual adjustment.
- Finance: revenue vs expenses = profit; Sync Costs pulls ad/API spend.
- Agents: enable/disable AI agents, set credits per generation.
- AI Operations / Generation Log: every generation, failures, cost.
- Support: customer tickets. WhatsApp Inbox: live chats + AI drafts.
- Approvals: discount/refund/expense requests → manager approves.
- Incentives / Leaderboard: targets, commission, rankings, badges.
- Team / Attendance: members+roles; check-in/out, work hours.
- Hiring OS: candidates, assessments, pipeline (Applied→Hired).
- Knowledge Base: SOPs, scripts, training.
- Settings / Integrations: company config, connection status.

ROLE RULES (mention if relevant):
- Sales: handle leads, call, update status honestly, fill daily report, mark hot leads, never fake interest.
- Admin: run platform, manage tickets/content/credits, can't change team roles (founder only).
- HR: manage employees, salary, leaves, hiring pipeline.
- Founder: everything.

If asked "how do I X", give the exact menu path + steps.
`.trim();

export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("authorization")))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { question, role } = await req.json().catch(() => ({}));
  if (!question || question.trim().length < 2) {
    return NextResponse.json({ error: "Apna sawaal type karo." }, { status: 400 });
  }
  const result = await callLLM({
    system: HELP_SYSTEM,
    user: `${role ? `My role: ${role}\n` : ""}Question: ${question.slice(0, 1500)}`,
    maxTokens: 500,
    temperature: 0.3,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, answer: result.text });
}
