"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "./components/ThemeProvider";

type Agent = {
  title: string;
  desc: string;
  link: string;
  tag: string;
  imageClass: string;
};

export default function Home() {
  const { darkMode } = useTheme();
 const [isLoggedIn, setIsLoggedIn] = useState(false);

  const agents: Agent[] = useMemo(
    () => [
      {
        title: "TextilePrints to Mockup AI",
        desc: "Convert textile motifs into premium fashion model mockups with article code placement.",
        link: "/textileprints-to-mockup",
        tag: "Textile AI",
        imageClass:
          "bg-[radial-gradient(circle_at_25%_20%,#22d3ee_0_12%,transparent_13%),repeating-linear-gradient(45deg,#0ea5e9_0_14px,#facc15_14px_28px,#a78bfa_28px_42px,#fb7185_42px_56px)]",
      },
      {
        title: "Jewellery AI",
        desc: "Create realistic model shoots and luxury product photography for jewellery brands.",
        link: "/jewellery-ai",
        tag: "Jewellery AI",
        imageClass:
          "bg-[radial-gradient(circle_at_50%_38%,#fff7ad_0_8%,transparent_9%),radial-gradient(circle_at_50%_50%,#f59e0b_0_18%,transparent_19%),linear-gradient(135deg,#fde68a,#f59e0b,#78350f)]",
      },
      {
        title: "Productography AI",
        desc: "Turn product images into catalogue-ready visuals, Instagram posts, and ad creatives.",
        link: "/productography-ai",
        tag: "Productography AI",
        imageClass:
          "bg-[radial-gradient(circle_at_35%_35%,#ffffffaa_0_10%,transparent_11%),linear-gradient(135deg,#67e8f9,#2563eb,#7c3aed)]",
      },
    ],
    [],
  );

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setIsLoggedIn(Boolean(data.session?.user));
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const bg = darkMode
    ? "bg-[#070b14] text-white"
    : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "bg-white/[0.07] border-white/10 shadow-black/40"
    : "bg-white/80 border-black/10 shadow-black/10";
  const muted = darkMode ? "text-white/65" : "text-black/60";

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 h-full w-full object-cover opacity-20"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />
      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10">
        <section className="mx-auto max-w-7xl px-5 py-16 text-center md:py-24">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">
            Live credits and profile are shown in the top bar after login
          </div>

          <h2 className="mx-auto max-w-5xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Create Premium Product Visuals
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              with AI Agents
            </span>
          </h2>

          <p className={`mx-auto mt-6 max-w-3xl text-lg leading-8 ${muted}`}>
            AgentForge helps textile, jewellery, and product brands convert
            simple images into premium mockups, catalogue shots, and ad-ready
            creatives.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href={isLoggedIn ? "/textileprints-to-mockup" : "/signup"}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105"
            >
              Start Creating
            </Link>
            <Link
              href="/gallery"
              className={`rounded-full px-8 py-4 font-bold ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}
            >
              See Visuals
            </Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
            {agents.map((agent) => (
              <Link
                key={agent.title}
                href={agent.link}
                className={`rounded-[2rem] border p-5 backdrop-blur-xl transition hover:-translate-y-1 ${card}`}
              >
                <div
                  className={`mx-auto mb-4 h-40 w-full rounded-[1.5rem] ${agent.imageClass}`}
                />
                <h3 className="text-xl font-black">{agent.tag}</h3>
                <p className={`mt-1 text-sm ${muted}`}>{agent.title}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-8 text-center">
            <h3 className="text-4xl font-black">Our AI Agents</h3>
            <p className={`mx-auto mt-3 max-w-2xl leading-7 ${muted}`}>
              Three powerful AI agents built to make product visuals faster,
              smarter, and more premium.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {agents.map((item) => (
              <Link
                key={item.title}
                href={item.link}
                className={`group overflow-hidden rounded-[2rem] border shadow-xl backdrop-blur-xl transition hover:-translate-y-1 ${card}`}
              >
                <div className={`h-48 w-full ${item.imageClass}`} />
                <div className="p-6">
                  <p className="mb-3 inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-600">
                    {item.tag}
                  </p>
                  <h4 className="text-2xl font-black">{item.title}</h4>
                  <p className={`mt-3 leading-7 ${muted}`}>{item.desc}</p>
                  <div className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-black text-white">
                    Open Agent
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className={`rounded-[2rem] border p-8 backdrop-blur-xl ${card}`}>
            <div className="mb-8 text-center">
              <h3 className="text-4xl font-black">How AgentForge Works</h3>
              <p className={`mt-3 ${muted}`}>
                Simple flow. Business-grade output.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-4">
              {[
                [
                  "01",
                  "Upload",
                  "Upload your product, motif, or jewellery image.",
                ],
                [
                  "02",
                  "Customize",
                  "Choose model, style, background, and output quality.",
                ],
                [
                  "03",
                  "Generate",
                  "Let the AI agent create your premium visual.",
                ],
                [
                  "04",
                  "Download",
                  "Download, share, or send the output to your client.",
                ],
              ].map(([num, title, desc]) => (
                <div
                  key={title}
                  className={`rounded-3xl border p-6 text-center ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70"}`}
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/20 text-sm font-black text-cyan-600">
                    {num}
                  </div>
                  <h4 className="text-xl font-black">{title}</h4>
                  <p className={`mt-2 text-sm leading-6 ${muted}`}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h3 className="text-4xl font-black leading-tight">
                Built for sellers, brands, and creative teams.
              </h3>
              <p className={`mt-4 leading-7 ${muted}`}>
                AgentForge is made for businesses that depend on high-quality
                product visuals. Create faster catalogues, better ads, and
                premium client presentations.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Textile Sellers",
                "Jewellery Brands",
                "E-commerce Stores",
                "Instagram Shops",
                "Fashion Designers",
                "Creative Agencies",
              ].map((item) => (
                <div
                  key={item}
                  className={`rounded-2xl border p-5 font-semibold backdrop-blur-xl ${card}`}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12">
          <div
            className={`rounded-[2rem] border p-8 text-center backdrop-blur-xl ${card}`}
          >
            <h3 className="text-4xl font-black">Credit Based AI Generation</h3>
            <p className={`mx-auto mt-3 max-w-2xl leading-7 ${muted}`}>
              Credits are added after signup/login. Your header shows live
              available credits, and every generation deducts credits from your
              account.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ["Starter", "For shopkeepers and testing", "₹1,999 / month"],
                ["Growth", "For agents and daily sellers", "₹17,999 / month"],
                ["Scale", "For factories and bulk output", "₹49,999 / month"],
              ].map(([title, desc, price]) => (
                <div
                  key={title}
                  className={`rounded-3xl border p-6 ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70"}`}
                >
                  <h4 className="text-2xl font-black">{title}</h4>
                  <p className={`mt-2 text-sm ${muted}`}>{desc}</p>
                  <p className="mt-5 text-xl font-black text-cyan-600">
                    {price}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/pricing"
              className="mt-8 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3 font-black text-white"
            >
              View Pricing
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="rounded-[2rem] bg-gradient-to-r from-cyan-400 to-blue-600 p-10 text-center text-white shadow-2xl shadow-cyan-500/30">
            <h3 className="text-4xl font-black">
              Ready to create your first AI visual?
            </h3>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-white/85">
              Upload your motif and generate your first premium model mockup
              with article number/code placement.
            </p>
            <Link
              href={isLoggedIn ? "/textileprints-to-mockup" : "/signup"}
              className="mt-7 inline-flex rounded-full bg-white px-8 py-4 font-black text-black"
            >
              TextilePrints to Mockup AI
            </Link>
          </div>
        </section>

      </div>

    </main>
  );
}
