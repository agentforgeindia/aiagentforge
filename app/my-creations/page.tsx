"use client";

import Link from "next/link";
import { useTheme } from "@/app/components/ThemeProvider";

export default function MyCreationsPage() {
  const { darkMode } = useTheme();

  // TODO: AuthProvider + Supabase query will replace with real data
  const creations: [] = [];

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const muted = darkMode ? "text-white/55" : "text-black/55";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />
      <div className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`} style={{ backgroundImage: "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

      <div className="relative z-10">
        <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">Your Work</div>
            <h2 className="text-4xl font-black md:text-5xl">My Creations</h2>
            <p className={`mt-3 ${muted}`}>All your AI-generated visuals in one place.</p>
          </div>

          {creations.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {/* Illustration icon */}
              <div className="relative mb-8">
                <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-xl">
                  <svg className={`h-16 w-16 ${darkMode ? "text-white/25" : "text-black/20"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
                {/* Decorative dots */}
                <div className="absolute -right-2 -top-2 h-4 w-4 animate-pulse rounded-full bg-cyan-400/40" />
                <div className="absolute -bottom-1 -left-3 h-3 w-3 animate-pulse rounded-full bg-blue-400/30" style={{ animationDelay: "0.5s" }} />
                <div className="absolute -right-4 bottom-3 h-2 w-2 animate-pulse rounded-full bg-purple-400/30" style={{ animationDelay: "1s" }} />
              </div>

              <h3 className="text-2xl font-black md:text-3xl">No creations yet</h3>
              <p className={`mx-auto mt-4 max-w-md text-base leading-7 ${muted}`}>
                Start by uploading a design and generating your first AI mockup. Your creations will appear here.
              </p>

              <Link
                href="/textileprints-to-mockup"
                className="mt-8 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-cyan-500/25 transition hover:scale-105"
              >
                Start Creating
              </Link>

              <div className="mt-12 grid w-full max-w-lg gap-4 sm:grid-cols-3">
                {[
                  { icon: "📤", label: "Upload Design" },
                  { icon: "🤖", label: "AI Generates" },
                  { icon: "📥", label: "Download Result" },
                ].map((step) => (
                  <div key={step.label} className={`rounded-2xl border p-4 text-center ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70"}`}>
                    <div className="mb-2 text-2xl">{step.icon}</div>
                    <p className="text-sm font-bold">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Grid gallery — ready for when data exists */
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {/* Creation cards will render here */}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
