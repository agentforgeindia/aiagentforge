"use client";

// App home screen — shown at "/" inside the Android app.
//
// Logged out: sign-up offer (100 free credits) → Agents button →
//             showcase ("Made with AgentForge") → how it works.
// Logged in:  credits → Agents button → recent creations → showcase.
//
// Banners (under the top card) and the top offer (under the Agents
// button) come from Admin → App Content — see AppPromos.tsx.
//
// Agents are NOT listed here — the Agents button (and the centre
// button in the bottom bar) both open the one agents screen.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ChevronRight, X, Zap } from "lucide-react";

import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { APP_AGENTS, APP_SHOWCASE, type AppAgent, type ShowcaseItem } from "./appData";
import { pushBackHandler } from "./appBus";
import { BannerCarousel, OfferTicket, useAppContent } from "./AppPromos";
import { useCountUp } from "./useCountUp";

type Recent = {
  id: string;
  design_url?: string | null;
  output_image_url?: string | null;
  output_url?: string | null;
  image_url?: string | null;
  status: string;
};

type Filter = "all" | AppAgent["slug"];

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "textile", label: "Textile" },
  { key: "jewellery", label: "Jewellery" },
  { key: "productography", label: "Product" },
];

const HOW_IT_WORKS = [
  { title: "Upload a photo", text: "A fabric design, a jewellery piece or a product, straight from your phone." },
  { title: "Choose the look", text: "Pick the model, background and style you want." },
  { title: "Download and share", text: "Your visual is ready in about a minute, saved in Creations." },
];

const card =
  "rounded-3xl border border-black/8 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]";
const muted = "text-black/55 dark:text-white/55";

/** Stagger step for the .af-rise entrance (globals.css). */
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export default function AppHome() {
  const { user, profile, credits, loading } = useAuth();
  const [recent, setRecent] = useState<Recent[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [viewing, setViewing] = useState<ShowcaseItem | null>(null);
  const shownCredits = useCountUp(credits);
  const promos = useAppContent(loading ? null : !!user);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("generations")
      .select("id, design_url, output_image_url, output_url, image_url, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (active) setRecent((data as Recent[] | null) ?? []);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // Android back closes the showcase viewer first.
  useEffect(() => {
    if (!viewing) return;
    return pushBackHandler(() => setViewing(null));
  }, [viewing]);

  const firstName =
    (profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "")
      .trim()
      .split(" ")[0] || "";

  const showcase =
    filter === "all" ? APP_SHOWCASE.slice(0, 6) : APP_SHOWCASE.filter((item) => item.agent === filter);
  const viewingAgent = viewing ? APP_AGENTS.find((a) => a.slug === viewing.agent) : undefined;

  return (
    <main className="relative mx-auto w-full max-w-xl flex-1 px-4 pb-6 pt-4 text-[#111827] dark:text-white">
      {/* ───────── Top card: credits (logged in) or sign-up offer ───────── */}
      {user ? (
        <section className="af-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-5 text-white shadow-xl shadow-blue-600/25">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white/80">
                {firstName ? `Hello, ${firstName}` : "Welcome back"}
              </p>
              <p
                className="mt-2 flex items-center gap-1.5 text-4xl font-black leading-none"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                <Zap className="h-6 w-6 fill-current" />
                {shownCredits.toLocaleString("en-IN")}
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-white/75">
                credits{profile?.plan ? `, ${String(profile.plan)} plan` : ""}
              </p>
            </div>
            <Link
              href="/billing"
              className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-white/20 px-4 text-[13px] font-black backdrop-blur transition active:scale-95"
            >
              Add credits
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : (
        <section className="af-rise relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-5 text-white shadow-xl shadow-indigo-600/30">
          <div className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white/80">New here? Start with</p>
              <p className="mt-1.5 flex items-end gap-2 leading-none">
                <span className="af-pop-in text-[62px] font-black leading-[0.85] tracking-tight" style={{ fontVariantNumeric: "tabular-nums", "--d": "0.25s" } as CSSProperties}>
                  100
                </span>
                <span className="pb-0.5 text-xl font-black leading-[1.05]">
                  free
                  <br />
                  credits
                </span>
              </p>
            </div>
            {/* Three real outputs, fanned */}
            <div aria-hidden className="relative -mr-2 h-[104px] w-[122px] shrink-0">
              {[
                { src: "/gallery/jewellery/design-2.png", cls: "left-0 top-3 -rotate-[10deg]" },
                { src: "/gallery/productography/design-1.png", cls: "left-[26px] top-1 -rotate-2" },
                { src: "/gallery/textile/design-27.png", cls: "left-[52px] top-2 rotate-[7deg]" },
              ].map((shot, i) => (
                <div key={shot.src} className={`absolute h-[94px] w-[68px] ${shot.cls}`}>
                  {/* cards deal in one by one */}
                  <div
                    className="af-pop-in relative h-full w-full overflow-hidden rounded-xl border-2 border-white/90 shadow-lg shadow-black/30"
                    style={{ "--d": `${0.35 + i * 0.12}s` } as CSSProperties}
                  >
                    <Image src={shot.src} alt="" fill sizes="68px" className="object-cover object-right-top" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="relative mt-4 text-sm leading-6 text-white/85">
            Sign up and turn a mobile photo into a catalogue shoot. No model, no studio.
          </p>
          {!loading && (
            <div className="relative mt-4 flex items-center gap-5">
              <Link
                href="/signup"
                className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-indigo-700 shadow-lg shadow-black/20 transition active:scale-[0.98]"
              >
                Sign up free
              </Link>
              <Link href="/login" className="pr-2 text-sm font-black text-white underline decoration-white/50 underline-offset-4">
                Login
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ───────── Banners from the admin panel ───────── */}
      <BannerCarousel items={promos.banners} />

      {/* ───────── The one way into agents ───────── */}
      <Link
        href="/agents"
        className={`af-rise mt-4 flex items-center gap-3 p-3.5 transition active:scale-[0.99] ${card}`}
        style={step(1)}
      >
        <span className="flex shrink-0 -space-x-2.5">
          {APP_AGENTS.map((agent) => (
            <span
              key={agent.slug}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${agent.tint} text-white ring-[3px] ring-white dark:ring-[#111a2c]`}
            >
              <agent.Icon className="h-[18px] w-[18px]" />
            </span>
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-black leading-tight">Choose an agent</span>
          <span className={`mt-0.5 block truncate text-[13px] ${muted}`}>Textile, jewellery, product</span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/30">
          <ChevronRight className="h-5 w-5" />
        </span>
      </Link>

      {/* ───────── Top offer from the admin panel ───────── */}
      {promos.offers[0] && <OfferTicket item={promos.offers[0]} className="mt-4" />}

      {/* ───────── Recent creations (logged in) ───────── */}
      {user && recent && recent.length > 0 && (
        <>
          <div className="af-rise mb-3 mt-7 flex items-center justify-between" style={step(2)}>
            <h2 className="text-lg font-black">Your recent creations</h2>
            <Link href="/my-creations" className="flex items-center text-[13px] font-black text-cyan-600 dark:text-cyan-300">
              See all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="af-rise scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1" style={step(3)}>
            {recent.map((item) => {
              const src = item.output_image_url || item.output_url || item.image_url || item.design_url;
              if (!src) return null;
              return (
                <Link
                  key={item.id}
                  href="/my-creations"
                  className="relative h-40 w-[120px] shrink-0 overflow-hidden rounded-2xl border border-black/8 bg-black/5 dark:border-white/10 dark:bg-white/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Recent creation" loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
                  {item.status === "pending" && (
                    <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/60 py-1 text-center text-[10px] font-black text-white">
                      Processing
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* ───────── Showcase ───────── */}
      <div className="af-rise mt-7" style={step(2)}>
        <h2 className="text-lg font-black">Made with AgentForge</h2>
        <p className={`mt-0.5 text-[13px] ${muted}`}>Real results. The small picture is what was uploaded.</p>
      </div>
      <div className="af-rise scrollbar-hide -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" style={step(3)}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-black transition active:scale-95 ${
              filter === f.key
                ? "bg-[#111827] text-white dark:bg-white dark:text-[#111827]"
                : "border border-black/10 bg-white/80 text-black/65 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {showcase.map((item, index) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setViewing(item)}
            className="af-reveal group relative aspect-[4/5] overflow-hidden rounded-2xl border border-black/8 bg-black/5 text-left transition active:scale-[0.98] dark:border-white/10 dark:bg-white/5"
          >
            <Image
              src={item.src}
              alt={`${item.label} made with AgentForge`}
              fill
              sizes="(max-width: 640px) 50vw, 280px"
              priority={index < 2}
              className="object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2.5 pt-8 text-[13px] font-black text-white">
              {item.label}
            </span>
          </button>
        ))}
      </div>
      <Link
        href="/gallery"
        className={`mt-3 flex h-12 items-center justify-center gap-1 text-sm font-black transition active:scale-[0.99] ${card}`}
      >
        See more in Gallery
        <ChevronRight className="h-4 w-4" />
      </Link>

      {/* ───────── How it works (logged out) ───────── */}
      {!user && !loading && (
        <section className={`af-reveal mt-7 p-5 ${card}`}>
          <h2 className="text-lg font-black">How it works</h2>
          <ol className="mt-4 grid gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-white">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[15px] font-black leading-tight">{step.title}</span>
                  <span className={`mt-1 block text-[13px] leading-5 ${muted}`}>{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <Link
            href="/signup"
            className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition active:scale-[0.98]"
          >
            Sign up and get 100 free credits
          </Link>
        </section>
      )}

      {/* ───────── Showcase viewer ───────── */}
      {viewing && (
        <div className="af-fade fixed inset-0 z-[90] flex flex-col bg-black">
          <div className="flex h-14 shrink-0 items-center justify-between px-3">
            <button
              type="button"
              onClick={() => setViewing(null)}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="truncate px-3 text-sm font-black text-white/85">{viewing.label}</p>
            <span className="h-10 w-10" />
          </div>
          <div className="relative min-h-0 flex-1">
            <Image src={viewing.src} alt={`${viewing.label} made with AgentForge`} fill sizes="100vw" className="object-contain" />
          </div>
          {viewingAgent && (
            <div className="shrink-0 px-4 pt-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
              <Link
                href={viewingAgent.link}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-sm font-black text-white transition active:scale-[0.98]"
              >
                <viewingAgent.Icon className="h-4 w-4" />
                Make one with {viewingAgent.title}
              </Link>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
