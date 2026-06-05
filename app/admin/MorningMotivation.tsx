"use client";

// MorningMotivation — once-per-day popup with an AI message "by Founder".
// Reads the member's stats + birthday + achievements for a personal note.

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MorningMotivation() {
  const [open, setOpen]     = useState(false);
  const [msg, setMsg]       = useState("");
  const [bday, setBday]     = useState(false);
  const [achiever, setAchiever] = useState(false);

  useEffect(() => {
    const key = `af_motivation_${new Date().toISOString().slice(0, 10)}`;
    try { if (localStorage.getItem(key)) return; } catch { return; }

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;
      try {
        const res = await fetch("/api/admin/ai/motivation", {
          headers: { Authorization: `Bearer ${sess.session.access_token}` },
        });
        const json = await res.json();
        if (json.ok && json.message) {
          setMsg(json.message);
          setBday(json.birthday); setAchiever(json.achiever);
          setOpen(true);
          try { localStorage.setItem(key, "1"); } catch { /* ignore */ }
        }
      } catch { /* silent */ }
    })();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-cyan-200/40 bg-white shadow-2xl dark:border-cyan-400/20 dark:bg-[#0b1220]">
        {/* Banner */}
        <div className={`relative px-6 py-5 text-center ${bday ? "bg-gradient-to-r from-pink-400 to-fuchsia-500" : achiever ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-cyan-400 to-blue-600"}`}>
          <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
          <p className="text-4xl">{bday ? "🎂" : achiever ? "🏆" : "☀️"}</p>
          <h2 className="mt-2 text-lg font-black text-white">
            {bday ? "Happy Birthday!" : achiever ? "You're a Star!" : "Good Morning!"}
          </h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">A message from your Founder</p>
        </div>

        {/* Message */}
        <div className="px-6 py-5">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">{msg}</p>
          </div>
          <button type="button" onClick={() => setOpen(false)}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.02]">
            Let's go! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
