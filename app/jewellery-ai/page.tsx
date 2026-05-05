"use client";

import Link from "next/link";
import { useTheme } from "@/app/components/ThemeProvider";

export default function JewelleryAIPage() {
  const { darkMode } = useTheme();

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const muted = darkMode ? "text-white/55" : "text-black/55";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#fbbf2455,transparent_35%),radial-gradient(circle_at_top_right,#f59e0b44,transparent_35%),radial-gradient(circle_at_bottom,#eab30833,transparent_40%)]" />
      <div className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`} style={{ backgroundImage: "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-20">
        <div className="w-full max-w-lg text-center">
          {/* Badge */}
          <div className="mx-auto mb-8 inline-flex animate-pulse rounded-full border border-amber-400/30 bg-amber-400/10 px-5 py-2 text-sm font-black text-amber-600">
            Coming Soon
          </div>

          {/* Icon */}
          <div className="relative mx-auto mb-8">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 shadow-2xl shadow-amber-500/30">
              <svg className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 -z-10 mx-auto h-28 w-28 animate-pulse rounded-[2rem] bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 opacity-30 blur-2xl" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-black md:text-6xl">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Jewellery AI Studio
            </span>
          </h1>

          <p className="mx-auto mt-3 text-2xl font-black md:text-3xl">Launching Shortly</p>

          <p className={`mx-auto mt-5 max-w-md text-base leading-7 ${muted}`}>
            Create stunning model shoots and premium jewellery visuals with AI. Professional catalogue images for rings, necklaces, earrings, and more — in seconds.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => alert("You will be notified when Jewellery AI Studio launches!")}
              className="rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 px-8 py-4 font-black text-white shadow-xl shadow-amber-500/25 transition hover:scale-105"
            >
              Notify Me
            </button>
            <Link href="/" className={`rounded-full px-8 py-4 font-bold transition ${darkMode ? "bg-white/10 text-white" : "bg-white text-black shadow-sm"}`}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
