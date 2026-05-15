"use client";

import Link from "next/link";
import { useTheme } from "@/app/components/ThemeProvider";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

export default function ProductographyAIPage() {
  const { darkMode } = useTheme();

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const muted = darkMode ? "text-white/55" : "text-black/55";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%),radial-gradient(circle_at_bottom,#a78bfa33,transparent_40%)]" />
      <div className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`} style={{ backgroundImage: "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-20">
        <div className="w-full max-w-lg text-center">
          {/* Badge */}
          <div className="mx-auto mb-8 inline-flex animate-pulse rounded-full border border-purple-400/30 bg-purple-400/10 px-5 py-2 text-sm font-black text-purple-500">
            Coming Soon
          </div>

          {/* Icon */}
          <div className="relative mx-auto mb-8">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 shadow-2xl shadow-pink-500/30">
              <svg className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 -z-10 mx-auto h-28 w-28 animate-pulse rounded-[2rem] bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 opacity-30 blur-2xl" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-black md:text-6xl">
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Productography AI
            </span>
          </h1>

          <p className="mx-auto mt-3 text-2xl font-black md:text-3xl">Launching Shortly</p>

          <p className={`mx-auto mt-5 max-w-md text-base leading-7 ${muted}`}>
            Transform ordinary product photos into premium, ad-ready visuals. Studio-quality catalogue images powered by AI — no photographer needed.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => alert("You will be notified when Productography AI launches!")}
              className="rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 px-8 py-4 font-black text-white shadow-xl shadow-pink-500/25 transition hover:scale-105"
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
