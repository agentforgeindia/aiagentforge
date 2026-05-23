"use client";

import Link from "next/link";

export default function SignupPromptPopup({
  open,
  onClose,
  source = "generate",
  context,
}: {
  open: boolean;
  onClose: () => void;
  source?: string;
  context?: string; // e.g. "jewellery", "textile", "product shoot"
}) {
  if (!open) return null;

  const label = context || "AI mockup";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-cyan-200/60 bg-gradient-to-br from-white via-cyan-50 to-blue-50 text-[#111827] shadow-[0_0_80px_rgba(34,211,238,0.25)]"
      >
        {/* Glow blobs */}
        <div className="absolute -left-20 top-10 h-44 w-44 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-44 w-44 rounded-full bg-blue-300/40 blur-3xl" />

        {/* Floating sparkle doodles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-6 top-8 float-slow text-4xl opacity-70">✨</div>
          <div className="absolute left-5 top-12 float-medium text-3xl opacity-70">💎</div>
          <div className="absolute right-10 bottom-24 float-fast text-3xl opacity-70">🚀</div>
          <div className="absolute left-8 bottom-16 float-medium text-3xl opacity-70">🎁</div>
          <div className="absolute right-20 top-32 float-fast text-2xl opacity-60">✦</div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close popup"
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
          <div className="mb-4 inline-flex rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            🔒 Login Required
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-black leading-tight text-[#111827] sm:text-4xl">
            Sign up to start your{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              {label}
            </span>
          </h2>

          {/* Subtext */}
          <p className="mt-3 text-base text-black/70">
            Get{" "}
            <span className="font-bold text-black">100 free credits</span>{" "}
            on signup. No card required.
          </p>

          {/* Benefits */}
          <div className="mt-5 rounded-3xl border border-cyan-100 bg-white/70 p-4 text-left shadow-inner backdrop-blur">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-cyan-600">✓</span>
                <span className="text-black/75">Premium AI mockups in seconds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600">✓</span>
                <span className="text-black/75">Jewellery, textile, product visuals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600">✓</span>
                <span className="text-black/75">Save and download all outputs</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <Link
            href={`/signup?source=${encodeURIComponent(source)}`}
            onClick={onClose}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-cyan-400/30 transition hover:scale-[1.02]"
          >
            Sign Up Free — Get 100 Credits →
          </Link>

          {/* Secondary */}
          <p className="mt-4 text-xs text-black/45">
            Already have an account?{" "}
            <Link
              href={`/login?source=${encodeURIComponent(source)}`}
              onClick={onClose}
              className="font-bold text-cyan-700 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
