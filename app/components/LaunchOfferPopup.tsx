"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LaunchOfferPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
  const alreadyShown = localStorage.getItem("agentforge_offer_popup_seen");

  if (alreadyShown) return;

  const timer = setTimeout(() => {
    setShow(true);
    localStorage.setItem("agentforge_offer_popup_seen", "true");
  }, 5000);

  return () => clearTimeout(timer);
}, []);

  if (!show) return null;

  return (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-md">
    <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-cyan-200/60 bg-gradient-to-br from-white via-cyan-50 to-blue-50 text-[#111827] shadow-[0_0_80px_rgba(34,211,238,0.25)]">

      {/* Glow Effects */}
      <div className="absolute -left-20 top-10 h-44 w-44 rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-44 w-44 rounded-full bg-blue-300/40 blur-3xl" />

      {/* Floating Premium Doodles */}
<div className="pointer-events-none absolute inset-0 overflow-hidden">

  {/* Textile */}
  <div className="absolute left-[-10px] top-16 float-slow text-6xl opacity-100">
    👗
  </div>

  <div className="absolute right-2 top-36 float-medium text-5xl opacity-100">
    🧵
  </div>

  <div className="absolute left-20 bottom-24 float-fast text-5xl opacity-100">
    🪡
  </div>

  <div className="absolute left-1/3 top-52 float-medium text-5xl opacity-100">
    🧶
  </div>

  {/* Jewellery */}
  <div className="absolute right-8 top-10 float-slow text-6xl opacity-100">
    💍
  </div>

  <div className="absolute left-4 bottom-10 float-medium text-6xl opacity-100">
    👑
  </div>

  <div className="absolute right-16 bottom-40 float-fast text-5xl opacity-100">
    📿
  </div>

  <div className="absolute left-1/2 top-20 float-medium text-5xl opacity-100">
    💎
  </div>

  {/* Productography */}
  <div className="absolute left-1/2 bottom-6 -translate-x-1/2 float-slow text-5xl opacity-100">
    📦
  </div>

  <div className="absolute left-24 top-8 float-fast text-5xl opacity-100">
    📸
  </div>

  <div className="absolute right-24 bottom-14 float-medium text-5xl opacity-100">
    🛍️
  </div>

  <div className="absolute left-10 top-80 float-fast text-5xl opacity-100">
    🧴
  </div>

  {/* Celebration */}
  <div className="absolute left-5 top-6 float-medium text-4xl opacity-100">
    🎉
  </div>

  <div className="absolute right-6 top-20 float-fast text-4xl opacity-100">
    ✨
  </div>

  <div className="absolute left-10 bottom-32 float-medium text-4xl opacity-100">
    🎊
  </div>

  <div className="absolute right-10 bottom-20 float-slow text-4xl opacity-100">
    🚀
  </div>

  <div className="absolute left-1/4 top-1/2 float-fast text-3xl opacity-100">
    ✦
  </div>

  <div className="absolute right-1/4 top-1/3 float-medium text-3xl opacity-100">
    ✧
  </div>

</div>

      {/* Close Button */}
      <button
        onClick={() => setShow(false)}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-white/80 text-lg font-bold text-black backdrop-blur hover:bg-cyan-50"
      >
        ×
      </button>

      <div className="relative z-10 p-7 text-center">

        {/* Logo */}
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-cyan-200 bg-white shadow-2xl shadow-cyan-300/40">
          <img
            src="/af-logo.png"
            alt="AgentForge"
            className="h-full w-full rounded-[2rem] object-cover"
          />
        </div>

        {/* Badge */}
        <div className="mb-4 inline-flex rounded-full border border-cyan-200 bg-cyan-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-700">
          🚀 Launch Celebration
        </div>

        {/* Heading */}
        <h2 className="text-4xl font-black leading-tight text-[#111827]">
          Get{" "}
          <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            200 Free Credits
          </span>
        </h2>

        {/* Text */}
        <p className="mt-3 text-base text-black/70">
          Only for the first{" "}
          <span className="font-bold text-black">500 users</span>.
        </p>

        {/* Info Card */}
        <div className="mt-5 rounded-3xl border border-cyan-100 bg-white/70 p-4 shadow-inner backdrop-blur">
          <p className="text-sm font-bold text-[#111827]">
            Upload • Generate • Done
          </p>

          <p className="mt-1 text-xs text-black/50">
            Premium AI mockups in seconds.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/signup"
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-cyan-400/30 transition hover:scale-[1.02]"
        >
          Start Creating Now →
        </Link>

        <p className="mt-4 text-xs text-black/35">
          Offer valid for first 500 users only.
        </p>
      </div>
    </div>
  </div>
);
}