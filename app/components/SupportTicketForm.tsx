"use client";

// Raise-a-ticket form for the public /support page. Writes to
// public.support_tickets (status 'open') so it appears in the
// admin Support Center for the team to action.

import { useState } from "react";
import { LifeBuoy, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { value: "billing",    label: "Billing / Payment" },
  { value: "generation", label: "Generation / Image issue" },
  { value: "refund",     label: "Refund request" },
  { value: "account",    label: "Account / Login" },
  { value: "general",    label: "General question" },
];

export default function SupportTicketForm() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [category, setCategory] = useState("generation");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) { setError("Subject aur message zaroori hai."); return; }
    setSaving(true); setError(null);
    // Prefill from logged-in session if available
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id ?? null;
    const uEmail = email.trim() || sess.session?.user?.email || null;

    const { error: err } = await supabase.from("support_tickets").insert({
      user_id: uid,
      user_email: uEmail,
      user_name: name.trim() || null,
      category,
      subject: subject.trim(),
      description: message.trim(),
      priority,
      status: "open",
    });
    setSaving(false);
    if (err) { setError("Ticket save nahi hua. Thodi der baad try karein."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200/50 bg-emerald-50/60 p-8 text-center dark:border-emerald-400/20 dark:bg-emerald-500/5">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h3 className="mt-3 text-xl font-black">Ticket Raised!</h3>
        <p className="mt-1 text-sm font-medium text-black/60 dark:text-white/60">
          Hamari support team jald hi aapse contact karegi. Thank you!
        </p>
      </div>
    );
  }

  const input = "w-full rounded-xl border border-cyan-200/50 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 dark:border-white/10 dark:bg-white/5 dark:text-white";

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-cyan-200/40 bg-white/85 p-6 shadow-xl backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05] sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600">Need help?</p>
          <h3 className="text-xl font-black">Raise a Support Ticket</h3>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={input} placeholder="Email / phone" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className={input} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low priority</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <input className={input} placeholder="Subject *" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        <textarea className={input} rows={4} placeholder="Apni problem detail mein likhein… *" value={message} onChange={(e) => setMessage(e.target.value)} required />

        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

        <button type="submit" disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50">
          <Send className="h-4 w-4" />{saving ? "Submitting…" : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
}
