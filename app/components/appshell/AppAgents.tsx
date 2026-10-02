"use client";

// Agents tab — shown at "/agents" inside the Android app.

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { APP_AGENTS } from "./appData";

export default function AppAgents() {
  return (
    <main className="relative mx-auto w-full max-w-xl flex-1 px-4 pb-6 pt-4 text-[#111827] dark:text-white">
      <p className="text-sm leading-6 text-black/55 dark:text-white/55">
        Pick what you want to create. Each one takes a photo and returns a finished visual.
      </p>

      <div className="mt-4 grid gap-4">
        {APP_AGENTS.map((agent) => (
          <article
            key={agent.slug}
            className="overflow-hidden rounded-3xl border border-black/8 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]"
          >
            <div className="flex items-start gap-3 p-4 pb-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.tint} text-white shadow-md`}
              >
                <agent.Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-black leading-tight">{agent.title}</h2>
                <p className="mt-1 text-[13px] leading-5 text-black/55 dark:text-white/55">{agent.detail}</p>
              </div>
            </div>

            <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-1">
              {agent.samples.map((src) => (
                <div
                  key={src}
                  className="relative h-32 w-[100px] shrink-0 overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5"
                >
                  <Image src={src} alt={`${agent.title} sample`} fill sizes="100px" className="object-cover object-right-top" />
                </div>
              ))}
            </div>

            <div className="p-4 pt-3">
              <Link
                href={agent.link}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition active:scale-[0.98]"
              >
                Open {agent.title}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-5 text-center text-xs font-semibold text-black/45 dark:text-white/45">
        More agents are on the way.
      </p>
    </main>
  );
}
