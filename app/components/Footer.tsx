"use client";

import Link from "next/link";
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaXTwitter,
  FaLinkedinIn,
  FaPinterestP,
} from "react-icons/fa6";

import { useTheme } from "./ThemeProvider";

export default function Footer() {
  const { darkMode } = useTheme();

  const muted = darkMode ? "text-white/55" : "text-black/55";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";

  return (
    <>
      <footer className="relative z-10 mx-auto max-w-7xl px-5 pb-8 pt-10">
        <div
          className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl ${card}`}
        >
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
                  <img
                    src="/af-logo.png"
                    alt="AgentForge Logo"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-black">AgentForge</h3>
                  <p className={`text-xs ${muted}`}>
                    AI tools for visual business
                  </p>
                </div>
              </div>

              <p className={`mt-4 max-w-sm text-sm leading-6 ${muted}`}>
                Create premium product visuals with TextilePrints to Mockup AI,
                Jewellery AI Studio, and Productography AI.
              </p>

              {/* SOCIAL ICONS */}
              <div className="mt-5 flex items-center gap-4">
                <a
                  href="https://instagram.com/agentforgeindia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:scale-110 hover:text-cyan-400"
                >
                  <FaInstagram size={18} />
                </a>

                <a
                  href="https://facebook.com/Agentforgeindia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:scale-110 hover:text-cyan-400"
                >
                  <FaFacebookF size={18} />
                </a>

                <a
                  href="https://youtube.com/agentforgeindia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:scale-110 hover:text-cyan-400"
                >
                  <FaYoutube size={18} />
                </a>

                <a
                  href="https://x.com/Agentforgeindia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:scale-110 hover:text-cyan-400"
                >
                  <FaXTwitter size={18} />
                </a>

                <a
                  href="https://linkedin.com/agentforgeindia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:scale-110 hover:text-cyan-400"
                >
                  <FaLinkedinIn size={18} />
                </a>

                <a
                  href="https://pinterest.com/agentforgeindia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:scale-110 hover:text-cyan-400"
                >
                  <FaPinterestP size={18} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-black">Product</h4>

              <div className={`space-y-2 text-sm ${muted}`}>
                <Link
                  href="/textileprints-to-mockup"
                  className="block transition-colors hover:text-cyan-500"
                >
                  TextilePrints to Mockup AI
                </Link>

                <Link
                  href="/jewellery-ai"
                  className="block transition-colors hover:text-cyan-500"
                >
                  Jewellery AI Studio
                </Link>

                <Link
                  href="/productography-ai"
                  className="block transition-colors hover:text-cyan-500"
                >
                  Productography AI
                </Link>

                <Link
                  href="/pricing"
                  className="block transition-colors hover:text-cyan-500"
                >
                  Pricing
                </Link>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-black">Company</h4>

              <div className={`space-y-2 text-sm ${muted}`}>
                <Link
                  href="/gallery"
                  className="block transition-colors hover:text-cyan-500"
                >
                  Gallery
                </Link>

                <Link
                  href="/profile"
                  className="block transition-colors hover:text-cyan-500"
                >
                  Profile
                </Link>

                <Link
                  href="/settings"
                  className="block transition-colors hover:text-cyan-500"
                >
                  Settings
                </Link>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-black">Legal</h4>

              <div className={`space-y-2 text-sm ${muted}`}>
                <Link
                  href="/privacy-policy"
                  className="block transition-colors hover:text-cyan-500"
                >
                  Privacy Policy
                </Link>

                <Link
                  href="/terms"
                  className="block transition-colors hover:text-cyan-500"
                >
                  Terms &amp; Conditions
                </Link>

                <Link
                  href="/refund-policy"
                  className="block transition-colors hover:text-cyan-500"
                >
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>

          <div
            className={`mt-6 flex flex-col justify-between gap-3 border-t pt-5 text-xs md:flex-row ${
              darkMode
                ? "border-white/10 text-white/45"
                : "border-black/10 text-black/45"
            }`}
          >
            <p>&copy; 2026 AgentForge. All rights reserved.</p>

            <p>
              Built by ViralBrand — helping businesses create AI-powered visual
              content faster.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}