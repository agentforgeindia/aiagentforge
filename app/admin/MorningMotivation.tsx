"use client";

// MorningMotivation — once-per-day popup with an AI motivational message.
// Shows a rotating famous-personality quote at the bottom.

import { useEffect, useState } from "react";
import { X, Sparkles, Quote } from "lucide-react";
import { supabase } from "@/lib/supabase";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You are never too old to set another goal or dream a new dream.", author: "C.S. Lewis" },
  { text: "The harder I work, the luckier I get.", author: "Samuel Goldwyn" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "If you are not willing to risk the usual, you will have to settle for the ordinary.", author: "Jim Rohn" },
  { text: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney" },
  { text: "The people who are crazy enough to think they can change the world are the ones who do.", author: "Steve Jobs" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Twenty years from now you will be more disappointed by the things that you didn't do.", author: "Mark Twain" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
];

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

export default function MorningMotivation() {
  const [open, setOpen]     = useState(false);
  const [msg, setMsg]       = useState("");
  const [bday, setBday]     = useState(false);
  const [achiever, setAchiever] = useState(false);
  const quote = getDailyQuote();

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

  const gradient = bday
    ? "bg-gradient-to-r from-pink-400 to-fuchsia-500"
    : achiever
    ? "bg-gradient-to-r from-amber-400 to-orange-500"
    : "bg-gradient-to-r from-cyan-400 to-blue-600";

  const emoji = bday ? "🎂" : achiever ? "🏆" : "☀️";
  const heading = bday ? "Happy Birthday!" : achiever ? "You're a Star!" : "Good Morning!";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-cyan-200/40 bg-white shadow-2xl dark:border-cyan-400/20 dark:bg-[#0b1220]">

        {/* Banner */}
        <div className={`relative px-6 py-5 text-center ${gradient}`}>
          <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
          <p className="text-4xl">{emoji}</p>
          <h2 className="mt-2 text-lg font-black text-white">{heading}</h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">AgentForge</p>
        </div>

        {/* AI Message */}
        <div className="px-6 pt-5">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">{msg}</p>
          </div>
        </div>

        {/* Daily Quote */}
        <div className="mx-6 my-4 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start gap-2">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
            <div>
              <p className="text-sm font-medium italic leading-relaxed text-slate-700 dark:text-slate-300">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="mt-1.5 text-[11px] font-black uppercase tracking-widest text-purple-500">
                — {quote.author}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button type="button" onClick={() => setOpen(false)}
            className={`w-full rounded-full ${gradient} py-3 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]`}>
            Let's go! 🚀
          </button>
        </div>

      </div>
    </div>
  );
}
