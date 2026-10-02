"use client";

// App home screen — shown at "/" inside the Android app.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Images, LifeBuoy, PlayCircle, Sparkles, Zap } from "lucide-react";

import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { APP_AGENTS } from "./appData";

type Recent = {
  id: string;
  design_url?: string | null;
  output_image_url?: string | null;
  output_url?: string | null;
  image_url?: string | null;
  status: string;
};

const card =
  "rounded-3xl border border-black/8 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]";
const muted = "text-black/55 dark:text-white/55";

export default function AppHome() {
  const { user, profile, credits, loading } = useAuth();
  const [recent, setRecent] = useState<Recent[] | null>(null);

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

  const firstName =
    (profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "")
      .trim()
      .split(" ")[0] || "";

  return (
    <main className="relative mx-auto w-full max-w-xl flex-1 px-4 pb-6 pt-4 text-[#111827] dark:text-white">
      {/* ───────── Greeting / welcome ───────── */}
      {user ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-5 text-white shadow-xl shadow-blue-600/25">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-sm font-semibold text-white/80">{firstName ? `Hello, ${firstName}` : "Welcome back"}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Credits</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-4xl font-black leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <Zap className="h-6 w-6 fill-current" />
                  {credits.toLocaleString("en-IN")}
                </p>
              </div>
              <Link
                href="/billing"
                className="flex h-10 items-center gap-1 rounded-full bg-white/20 px-4 text-[13px] font-black backdrop-blur transition active:scale-95"
              >
                Details
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {profile?.plan ? (
              <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider">
                {String(profile.plan)} plan
              </p>
            ) : null}
          </div>
        </section>
      ) : (
        <section className={`relative overflow-hidden p-5 ${card}`}>
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
              <Sparkles className="h-3 w-3" />
              AI visual studio
            </p>
            <h1 className="mt-3 text-[26px] font-black leading-[1.1] tracking-tight">
              Mobile photo in.
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Catalogue shoot out.
              </span>
            </h1>
            <p className={`mt-2 text-sm leading-6 ${muted}`}>
              No model, no studio. Upload a photo and get a ready-to-share visual in about a minute.
            </p>
            {!loading && (
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Link
                  href="/signup"
                  className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition active:scale-[0.98]"
                >
                  Start free
                </Link>
                <Link
                  href="/login"
                  className="flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-black text-[#111827] transition active:scale-[0.98] dark:border-white/15 dark:bg-white/10 dark:text-white"
                >
                  Login
                </Link>
              </div>
            )}
            <p className={`mt-3 text-center text-xs font-semibold ${muted}`}>100 free credits when you sign up</p>
          </div>
        </section>
      )}

      {/* ───────── Agents ───────── */}
      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="text-lg font-black">Create</h2>
        <Link href="/agents" className="flex items-center text-[13px] font-black text-cyan-600 dark:text-cyan-300">
          All agents
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3">
        {APP_AGENTS.map((agent) => (
          <Link
            key={agent.slug}
            href={agent.link}
            className={`group flex items-stretch overflow-hidden transition active:scale-[0.99] ${card}`}
          >
            <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.tint} text-white shadow-md`}
              >
                <agent.Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-base font-black leading-tight">{agent.title}</p>
              <p className={`mt-1 text-[13px] leading-5 ${muted}`}>{agent.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-black text-cyan-600 dark:text-cyan-300">
                Start
                <ChevronRight className="h-4 w-4 transition group-active:translate-x-0.5" />
              </span>
            </div>
            <div className="relative w-[38%] shrink-0 self-stretch">
              <Image
                src={agent.image}
                alt={`${agent.title} sample`}
                fill
                sizes="160px"
                className="object-cover object-right-top"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* ───────── Recent creations ───────── */}
      {user && recent && recent.length > 0 && (
        <>
          <div className="mb-3 mt-6 flex items-center justify-between">
            <h2 className="text-lg font-black">Recent creations</h2>
            <Link href="/my-creations" className="flex items-center text-[13px] font-black text-cyan-600 dark:text-cyan-300">
              See all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
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
                    <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/60 py-1 text-center text-[10px] font-black uppercase tracking-wider text-white">
                      Processing
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* ───────── Quick links ───────── */}
      <h2 className="mb-3 mt-6 text-lg font-black">Explore</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/gallery", label: "Gallery", Icon: Images },
          { href: "/tutorials", label: "Tutorials", Icon: PlayCircle },
          { href: "/support", label: "Support", Icon: LifeBuoy },
        ].map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-2 px-2 py-4 text-center transition active:scale-[0.98] ${card}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-[13px] font-black">{label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
