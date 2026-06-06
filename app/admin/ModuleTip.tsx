"use client";

// ============================================================
// ModuleTip — dismissible "how to use" banner per module.
// ============================================================
// Renders automatically inside AdminShell based on page title.
// Once a user clicks "Got it", that tip stays hidden (localStorage).
// Keep tips short, simple and action-oriented.
// ============================================================

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

type Tip = { what: string; steps: string[] };

const TIPS: Record<string, Tip> = {
  "Founder Command Center": {
    what: "Founder-only view — live cash position, monthly goals and team output in one place.",
    steps: [
      "Check Live Numbers at the top: revenue, cash-in-bank, outstanding.",
      "Use 'Set Targets' to enter this month's revenue, customer and generation goals.",
      "Goal cards show a progress bar so you can see how close you are to each target.",
    ],
  },
  "Affiliate Partners": {
    what: "Manage referral partners — each gets a unique link and earns commission on every sale they bring.",
    steps: [
      "Add a partner with their name, email and commission rate.",
      "Share their unique referral link with them.",
      "Track their referred signups and commission payouts from this panel.",
    ],
  },
  "War Room": {
    what: "Your daily dashboard — open tasks, hot leads and the most important numbers at a glance.",
    steps: [
      "Check open tasks first — overdue ones are highlighted in red.",
      "Hot leads at the top need to be called today.",
      "Use the quick-action buttons to log a call or update a lead without switching pages.",
    ],
  },
  "Customers": {
    what: "All registered users — their plan, credits, usage and contact details.",
    steps: [
      "Search by name, email or phone.",
      "Click a customer to see their full generation history and billing.",
      "Use 'Add Credits' to manually top up a customer's balance.",
    ],
  },
  "Leads": {
    what: "Inbound prospects — everyone who filled a form, called or showed interest but has not paid yet.",
    steps: [
      "New leads land here automatically from the website form.",
      "Update the status (New → Contacted → Demo Sent → Hot Lead) as you progress.",
      "Add notes after each call so the next team member has full context.",
    ],
  },
  "Templates & Links": {
    what: "Ready-to-send WhatsApp messages, pitch scripts and shareable product links.",
    steps: [
      "Pick a template (intro, follow-up, demo, closing) and tap Copy.",
      "Paste into WhatsApp — personalise the name and product if needed.",
      "Short product links can be shared directly in chats or on social media.",
    ],
  },
  "🏆 Sales War Room": {
    what: "The whole sales team in one view — who called, who hit targets, what is open.",
    steps: [
      "See each caller's daily numbers: calls made, demos sent, hot leads, paid.",
      "Click any team member to drill into their lead list.",
      "Use the top bar filters to switch between Today, This Week and This Month.",
    ],
  },
  "Help & Rules": {
    what: "Your role's rules, commission structure and escalation process — all in one place.",
    steps: [
      "Read your role's rules carefully before your first day.",
      "Commission slabs and payout dates are listed here.",
      "If you have a dispute or question, use the escalation contact shown at the bottom.",
    ],
  },
  "AgentForge Caller GPT": {
    what: "Live call assistant — type what the customer said and get a ready-to-speak reply instantly.",
    steps: [
      "Type the customer's question or objection.",
      "Copy the AI reply and deliver it naturally.",
      "Even first-day callers can handle tough objections — every answer is ready.",
    ],
  },
  "Daily Caller Reports": {
    what: "Each caller logs their daily numbers here — supervisors see the full team total.",
    steps: [
      "Fill in your calls, demos, hot leads and paid count, then tap 'Save My Report'.",
      "Supervisors see the team totals and each caller's individual row.",
      "Change the date to review past reports.",
    ],
  },
  "Sales Command Center": {
    what: "The calling team's daily work hub — see which leads to call right now.",
    steps: [
      "Call 🔥 Hot Leads first — they have the highest conversion chance.",
      "Tap 'Call' on a lead to open their number and log the outcome.",
      "Saving the outcome automatically updates the lead status.",
    ],
  },
  "Deals Pipeline": {
    what: "Track large or formal deals from proposal to close.",
    steps: [
      "Create a deal with 'New Deal', set the value and stage.",
      "Use the stage dropdown to advance the deal forward.",
      "The 'Pipeline Value' banner shows the total business currently in the pipeline.",
    ],
  },
  "Tasks": {
    what: "Team follow-ups, demos and reminders.",
    steps: [
      "Create a task and assign it to a team member.",
      "Set a due date — overdue tasks surface as alerts in the War Room.",
      "Update the status when done.",
    ],
  },
  "Analytics": {
    what: "Meta Ads, Google Analytics and Microsoft Clarity data in one view — last 7 days.",
    steps: [
      "Use the gradient buttons at the top to open each platform's full dashboard.",
      "If a Meta token is configured, ad spend, clicks and CTR appear directly here.",
      "GA4 and Clarity require API keys set in the environment (founder task).",
    ],
  },
  "Marketing Center": {
    what: "Where your leads are coming from (Meta / Google) and email campaign performance.",
    steps: [
      "Check the source breakdown to see which channel is performing best.",
      "Use the daily leads chart to spot trends.",
      "Email template metrics show delivery and open rates.",
    ],
  },
  "Credit Center": {
    what: "The full credit system — credits sold, credits used and each user's balance.",
    steps: [
      "The ledger shows every transaction like a bank statement.",
      "Top Consumers shows who is using the most credits.",
      "Use Manual Adjustment to add credits to any user's account.",
    ],
  },
  "Finance": {
    what: "Revenue minus expenses equals net profit. Real earnings are tracked here.",
    steps: [
      "Use 'Add Expense' to log manual costs (salary, hosting, etc.).",
      "'Sync Costs' pulls Meta Ads, OpenAI and FAL costs automatically.",
      "'Revenue by Agent' shows which AI agent is generating the most income.",
    ],
  },
  "Agent Management": {
    what: "Control every AI agent — toggle on/off, set credit cost, manage prompt versions.",
    steps: [
      "Toggle Enabled off to disable an agent for all users.",
      "Set Credits Per Generation to control per-use pricing.",
      "Always tap 'Save Changes' after any update.",
    ],
  },
  "AI Operations": {
    what: "AI generation health — how many ran, failed and how many credits were used.",
    steps: [
      "Health Monitor shows 🟢/🟡/🔴 for each agent's status.",
      "Check Failed Jobs to catch problems early.",
      "The daily chart reveals usage trends over time.",
    ],
  },
  "WhatsApp Inbox": {
    what: "Customer WhatsApp messages arrive here — AI pre-drafts a reply for every one.",
    steps: [
      "Select a conversation on the left.",
      "The AI draft is pre-filled in the reply box — edit if needed, then tap 'Send'.",
      "Set WHATSAPP_AUTO_REPLY=true to let AI send replies automatically.",
    ],
  },
  "Generation Log": {
    what: "A detailed record of every AI generation — who ran it, which agent, status and cost.",
    steps: [
      "Filter by Agent or Status to narrow down.",
      "Total estimated cost is shown in the top-right.",
      "Find failed generations quickly to diagnose issues.",
    ],
  },
  "Error Logs": {
    what: "All system failures in one place — payment, webhook, generation and API errors.",
    steps: [
      "Focus on unresolved errors (shown in red).",
      "Filter by category — Payment errors are highest priority.",
      "Tap 'Resolve' once an error has been fixed.",
    ],
  },
  "Approvals": {
    what: "Team members raise discount, refund or expense requests here — manager approves or rejects.",
    steps: [
      "Create a request with 'New Request' (type + amount).",
      "Managers review pending requests in the Pending tab and Approve or Reject.",
      "Every decision is recorded with a note.",
    ],
  },
  "Refund & Dispute Center": {
    what: "Track all refund requests, disputes and chargebacks — with reason and approval trail.",
    steps: [
      "Log a refund or dispute with 'New Request'.",
      "Approve → then tap 'Mark Processed' once the money has been returned.",
      "'Open Amount' shows the total pending refund value.",
    ],
  },
  "AI Assistant": {
    what: "Three AI tools — call summary, sales coaching and WhatsApp reply drafting. Just paste text.",
    steps: [
      "Meeting Summary: paste a call transcript → get a structured summary and follow-up message.",
      "Sales Coach: paste call notes → get a score and improvement tips.",
      "WhatsApp Assistant: paste the customer's message → get a ready reply to copy and send.",
    ],
  },
  "AI Costs": {
    what: "API cost per agent and per-customer margin.",
    steps: [
      "Set or update the per-generation cost in the cost catalogue.",
      "Review top customers' cost vs revenue.",
      "Update the USD↔INR rate to keep numbers accurate.",
    ],
  },
  "Support Center": {
    what: "Customer problems — billing, generation and refund tickets.",
    steps: [
      "Log an issue with 'New Ticket' and set the priority.",
      "Move status from Open → In Progress → Resolved using the dropdown.",
      "Urgent tickets surface as alerts in the War Room.",
    ],
  },
  "Incentive Engine": {
    what: "Each sales member's target, achievement and incentive.",
    steps: [
      "Review commission rules (Starter ₹200, Pro ₹1,000, Empire ₹4,000).",
      "Set the member's monthly target.",
      "The progress bar shows how close each person is to their target.",
    ],
  },
  "🏆 Leaderboard": {
    what: "Team rankings — sales, working hours and tasks completed.",
    steps: [
      "Top 3 earn medals 🥇🥈🥉.",
      "Use 'Award Badge' to give a team member a recognition badge.",
      "Switch months to view historical data.",
    ],
  },
  "Team": {
    what: "Manage admins and their roles.",
    steps: [
      "Add a new member and assign their role (founder / admin / sales / support).",
      "The role determines what each person can see and do.",
      "Removing a member cuts off their access immediately.",
    ],
  },
  "Attendance": {
    what: "Team check-in / check-out and total online time — all tracked here.",
    steps: [
      "Each member starts their day with the 'Check In' button (top right).",
      "🟢 Currently Online shows who is actively working right now.",
      "Monthly Summary shows total hours for each team member.",
    ],
  },
  "Knowledge Base": {
    what: "SOPs, sales scripts and training documents for the team — all in one place.",
    steps: [
      "Filter by category (Sales / Support / Training).",
      "Click an article to read the full content.",
      "Use 'New Article' to add a new SOP — pin it to keep it at the top.",
    ],
  },
  "Hiring OS": {
    what: "No-resume hiring system — candidates apply, take a test and get scored automatically.",
    steps: [
      "Manage the applicant pipeline in 'Candidates' (Applied → Hired).",
      "Build assessment MCQs in 'Questions' by section and role.",
      "Use the funnel and leaderboard to identify top candidates.",
    ],
  },
  "Candidates": {
    what: "Each candidate's pipeline — stage, scores, salary and AI recommendation.",
    steps: [
      "Use the stage dropdown to move a candidate forward.",
      "Expand a card to add scores and expected / offered salary (final is auto-calculated).",
      "Tag strong rejections as Talent Pool to revisit them in the future.",
    ],
  },
  "Question Bank": {
    what: "MCQ questions for assessments — organised by section (basic / product / crm / sales) and role.",
    steps: [
      "Use 'Add Question' to create an MCQ with 4 options.",
      "Click the green circle next to the correct answer to mark it.",
      "Filter by section to manage questions more easily.",
    ],
  },
  "HR Module": {
    what: "Employees, their salaries and leave management.",
    steps: [
      "Add staff in the Employees tab and set their base salary.",
      "Approve or reject leave requests in the Leaves tab.",
      "Use 'Mark Paid' in the Salary tab to record a salary payment.",
    ],
  },
  "Automation Center": {
    what: "If-this-then-that rules — work happens automatically.",
    steps: [
      "Create a 'New Rule': choose a trigger first (e.g. Lead Created).",
      "Add one or more actions (assign, email, notify).",
      "Enable the rule — it runs automatically from that point.",
    ],
  },
  "Integrations": {
    what: "Connection status for all external services in one view.",
    steps: [
      "🟢 = connected, 🔴 = disconnected.",
      "If a service is red, check its API key or settings.",
      "Always check this page first when troubleshooting.",
    ],
  },
  "System Settings": {
    what: "Company info, plan pricing, credits and notification configuration.",
    steps: [
      "Change a value — a '•' indicator appears for any unsaved field.",
      "Tap 'Save All' at the top to save everything at once.",
      "Plan prices are controlled entirely from this page.",
    ],
  },
  "Testimonials": {
    what: "User reviews — approve them to display on the website.",
    steps: [
      "New reviews arrive in the Pending tab.",
      "Tap 'Approve' to make a review live on the homepage.",
      "Use 'Reject' or 'Delete' to remove inappropriate reviews.",
    ],
  },
};

export default function ModuleTip({ module: mod }: { module: string }) {
  const [open, setOpen] = useState(false);
  const tip = TIPS[mod];
  if (!tip) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ml-1.5 inline-flex items-center text-white/40 transition hover:text-white/80"
        title={`Help: ${mod}`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
              How to use
            </p>
            <h3 className="mb-2 text-base font-black text-white">{mod}</h3>
            <p className="mb-4 text-sm text-white/65">{tip.what}</p>
            <ol className="space-y-2">
              {tip.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-white/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-black text-cyan-400">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
