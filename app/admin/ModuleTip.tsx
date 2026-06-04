"use client";

// ============================================================
// ModuleTip — dismissible "how to use" banner per module.
// ============================================================
// Renders automatically inside AdminShell based on page title.
// Once a user clicks "Got it", that tip stays hidden (localStorage).
// Keep tips short, simple, action-oriented (Hinglish OK).
// ============================================================

import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";

type Tip = { what: string; steps: string[] };

// Keyed by the AdminShell `title` prop (exact match).
const TIPS: Record<string, Tip> = {
  "War Room": {
    what: "Aapka daily dashboard — sab kuch ek nazar mein: aaj ka revenue, naye leads, signups, AI usage aur net profit.",
    steps: [
      "Upar Scoreboard mein aaj ke numbers dekho.",
      "Red/amber alerts pe click karke seedha us page pe jao.",
      "AI Business Intelligence section smart suggestions deta hai — unhe follow karo.",
    ],
  },
  "Customers": {
    what: "Sabhi registered users — unka plan, credit balance, payment history aur notes.",
    steps: [
      "Kisi customer pe click karke uski poori timeline dekho.",
      "Health badge (green/yellow/red) batata hai kaun churn ho sakta hai.",
      "Notes add karke team ke liye context chhodo.",
    ],
  },
  "Leads": {
    what: "Inbound prospects — ads, website aur manual entries se aaye leads.",
    steps: [
      "Upar-right 'Pipeline' button se Kanban view kholo — cards ko Next/Back move karo.",
      "Har lead ka score (🔥/⚡/❄️) batata hai kaun hot hai.",
      "'New lead' se manually add karo.",
    ],
  },
  "Sales Command Center": {
    what: "Calling team ka daily kaam yahan se — kis lead ko abhi call karna hai.",
    steps: [
      "🔥 Hot Leads pehle call karo — sabse zyada chance.",
      "Lead pe 'Call' dabao → number khulega + outcome note karo.",
      "Outcome save karte hi lead status auto-update ho jaata hai.",
    ],
  },
  "Deals Pipeline": {
    what: "Bade/formal deals track karo — proposal se closure tak.",
    steps: [
      "'New Deal' se deal banao, value aur stage set karo.",
      "Stage dropdown se deal ko aage badhao.",
      "Upar 'Pipeline Value' batata hai kitna business pipeline mein hai.",
    ],
  },
  "Tasks": {
    what: "Team ke follow-ups, demos aur reminders.",
    steps: [
      "Task banao aur kisi member ko assign karo.",
      "Due date set karo — overdue tasks War Room mein alert karte hain.",
      "Done hone pe status update karo.",
    ],
  },
  "Marketing Center": {
    what: "Leads kahan se aa rahe hain (Meta/Google) aur email campaigns ka performance.",
    steps: [
      "Source breakdown dekho — kaunsa channel best chal raha hai.",
      "Daily leads chart se trend samjho.",
      "Email template performance se delivery rate check karo.",
    ],
  },
  "Credit Center": {
    what: "Poora credit system — kitne credits beche, use hue, balance kiska kitna hai.",
    steps: [
      "Ledger bank-statement jaisa har transaction dikhata hai.",
      "Top Consumers se pata chalega kaun zyada use kar raha.",
      "Manual Adjustment se kisi user ko credits add kar sakte ho.",
    ],
  },
  "Finance": {
    what: "Revenue vs Expenses = Net Profit. Asli kamaai yahan dikhti hai.",
    steps: [
      "'Add Expense' se manual kharche add karo (salary, hosting, etc.).",
      "'Sync Costs' se Meta Ads, OpenAI, FAL ka kharcha auto aata hai.",
      "Revenue by Agent batata hai kaunsa AI agent paisa kama raha.",
    ],
  },
  "Agent Management": {
    what: "Har AI agent ka control — on/off, credits cost, prompt version.",
    steps: [
      "Kisi agent ko band karna ho to Enabled toggle off karo.",
      "Credits Per Generation se pricing control karo.",
      "Change ke baad 'Save Changes' dabana zaroori hai.",
    ],
  },
  "AI Operations": {
    what: "AI generations ka health — kitne bane, fail hue, credits lage.",
    steps: [
      "Health Monitor mein 🟢/🟡/🔴 batata hai kaunsa agent theek hai.",
      "Failed Jobs section se problems jaldi pakdo.",
      "Daily chart se usage trend dekho.",
    ],
  },
  "AI Assistant": {
    what: "Teen AI tools — call summary, sales coaching, aur WhatsApp reply draft. Bas text paste karo.",
    steps: [
      "Meeting Summary: call transcript paste karo → structured summary + follow-up message milega.",
      "Sales Coach: call notes daalo → score + improvement tips milenge.",
      "WhatsApp Assistant: customer ka message paste karo → ready reply milega, Copy karke bhej do.",
    ],
  },
  "AI Costs": {
    what: "Har agent ka API kharcha aur per-customer margin.",
    steps: [
      "Cost catalogue mein per-generation cost set/update karo.",
      "Top customers ka cost vs revenue dekho.",
      "USD↔INR rate update karke sahi numbers paao.",
    ],
  },
  "Support Center": {
    what: "Customer ki problems — billing, generation, refund tickets.",
    steps: [
      "'New Ticket' se issue log karo aur priority set karo.",
      "Status dropdown se Open → In Progress → Resolved badlo.",
      "Urgent tickets War Room mein alert karte hain.",
    ],
  },
  "Incentive Engine": {
    what: "Har sales member ka target, achievement aur incentive.",
    steps: [
      "Commission rules dekho (Starter ₹200, Pro ₹1000, Empire ₹4000).",
      "Member ka monthly target set karo.",
      "Progress bar batata hai kaun target ke kitna paas hai.",
    ],
  },
  "🏆 Leaderboard": {
    what: "Team ki ranking — sales, kaam ke ghante aur tasks.",
    steps: [
      "Top 3 ko medals milte hain 🥇🥈🥉.",
      "'Award Badge' se kisi member ko badge do (motivation).",
      "Month change karke purana data dekho.",
    ],
  },
  "Team": {
    what: "Admins aur unke roles manage karo.",
    steps: [
      "Naya member add karke role do (founder/admin/sales/support).",
      "Role decide karta hai kaun kya dekh sakta hai.",
      "Member hata bhi sakte ho — access turant band.",
    ],
  },
  "Attendance": {
    what: "Team ka check-in/out aur kitna time online raha — sab yahan.",
    steps: [
      "Har member upar-right 'Check in' button se din shuru karta hai.",
      "🟢 Currently Online batata hai abhi kaun kaam pe hai.",
      "Monthly Summary mein har member ke total ghante dikhte hain.",
    ],
  },
  "Knowledge Base": {
    what: "Team ke liye SOPs, sales scripts aur training docs ek jagah.",
    steps: [
      "Category se filter karo (Sales/Support/Training).",
      "Article pe click karke poora padho.",
      "'New Article' se naya SOP add karo — pin karke top pe rakho.",
    ],
  },
  "HR Module": {
    what: "Employees, unki salary aur leave management.",
    steps: [
      "Employees tab mein staff add karo + base salary set karo.",
      "Leaves tab mein leave requests approve/reject karo.",
      "Salary tab mein 'Mark Paid' se payment record karo.",
    ],
  },
  "Automation Center": {
    what: "If-this-then-that rules — kaam apne aap ho jaaye.",
    steps: [
      "'New Rule' banao: pehle trigger chuno (jaise Lead Created).",
      "Phir actions add karo (assign, email, notify).",
      "Rule ko Enable karo — phir wo auto chalega.",
    ],
  },
  "Integrations": {
    what: "Saari services ka connection status ek jagah.",
    steps: [
      "🟢 = connected, 🔴 = disconnected.",
      "Red dikhe to wo service ka key/setting check karo.",
      "Troubleshooting mein ye sabse pehle dekho.",
    ],
  },
  "System Settings": {
    what: "Company info, plan pricing, credits aur notifications ka config.",
    steps: [
      "Koi value change karo — '•' dikhega jo unsaved hai.",
      "Upar 'Save All' dabake sab ek saath save karo.",
      "Plan prices yahan se control hote hain.",
    ],
  },
  "Testimonials": {
    what: "Users ke reviews — approve karne pe website pe dikhte hain.",
    steps: [
      "Pending tab mein naye reviews aate hain.",
      "'Approve' dabao to homepage pe live ho jaata hai.",
      "Galat ho to 'Reject' ya 'Delete' karo.",
    ],
  },
};

export default function ModuleTip({ title }: { title: string }) {
  const tip = TIPS[title];
  const storageKey = `af-tip-dismissed:${title}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!tip) return;
    try {
      setShow(localStorage.getItem(storageKey) !== "1");
    } catch {
      setShow(true);
    }
  }, [tip, storageKey]);

  if (!tip || !show) return null;

  function dismiss() {
    try { localStorage.setItem(storageKey, "1"); } catch { /* ignore */ }
    setShow(false);
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-700/40 dark:bg-amber-500/10">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <Lightbulb className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200">{tip.what}</p>
          <ul className="mt-1.5 space-y-0.5">
            {tip.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-800/90 dark:text-amber-300/80">
                <span className="font-bold">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold text-amber-700 transition hover:bg-amber-200/60 dark:text-amber-300 dark:hover:bg-amber-500/15"
        >
          Got it ✕
        </button>
      </div>
    </div>
  );
}
