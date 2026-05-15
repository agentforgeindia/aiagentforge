"use client";

import Link from "next/link";
import { useTheme } from "@/app/components/ThemeProvider";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

export default function JewelleryAIPage() {
  const { darkMode } = useTheme();

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const muted = darkMode ? "text-white/55" : "text-black/55";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#fbbf2455,transparent_35%),radial-gradient(circle_at_top_right,#f59e0b44,transparent_35%),radial-gradient(circle_at_bottom,#eab30833,transparent_40%)]" />
      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-20">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-8 inline-flex animate-pulse rounded-full border border-amber-400/30 bg-amber-400/10 px-5 py-2 text-sm font-black text-amber-600">
            Opening Shortly
          </div>

          <div className="relative mx-auto mb-8">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[2rem] bg-transparent">
  <img
    src="/af-logo.png"
    alt="AgentForge Logo"
    className="h-full w-full object-contain"
  />
</div>

            <div className="absolute inset-0 -z-10 mx-auto h-28 w-28 animate-pulse rounded-[2rem] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 opacity-30 blur-2xl" />
          </div>

          <h1 className="text-4xl font-black md:text-6xl">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Jewellery AI Studio
            </span>
          </h1>

          <p className="mx-auto mt-3 text-2xl font-black md:text-3xl">
            Launching Shortly
          </p>

          <p className={`mx-auto mt-5 max-w-md text-base leading-7 ${muted}`}>
            Create stunning model shoots and premium jewellery visuals with AI.
            Professional catalogue images for rings, necklaces, earrings, and more — in seconds.
          </p>

          <div className="mt-10 flex justify-center">
            <Link
              href="/"
              className={`rounded-full px-8 py-4 font-bold transition hover:scale-105 ${
                darkMode ? "bg-white/10 text-white" : "bg-white text-black shadow-sm"
              }`}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}