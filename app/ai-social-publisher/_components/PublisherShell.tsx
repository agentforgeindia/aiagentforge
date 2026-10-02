"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutList, Link2, Plus } from "lucide-react";
import { useStyles, PreviewBanner, PublisherStoreProvider, usePublisherStore } from "./ui";
import Composer from "./Composer";

const TABS = [
  { href: "/ai-social-publisher", label: "Planner", icon: CalendarDays },
  { href: "/ai-social-publisher/posts", label: "Posts", icon: LayoutList },
  { href: "/ai-social-publisher/accounts", label: "Accounts", icon: Link2 },
];

export default function PublisherShell({ children }: { children: React.ReactNode }) {
  return (
    <PublisherStoreProvider>
      <ShellInner>{children}</ShellInner>
      <Composer />
    </PublisherStoreProvider>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { darkMode, pageBg, muted, ghostBtn, primaryBtn } = useStyles();
  const { openComposer } = usePublisherStore();

  return (
    <main className={`relative min-h-screen overflow-hidden ${pageBg}`}>
      {/* Same background treatment as /my-creations */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />
      <div
        className={`pointer-events-none fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{ backgroundImage: "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-3 pb-24 pt-5 sm:px-5 sm:pb-16">
        <PreviewBanner />

        <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
              Social Media Scheduler
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Plan & post{" "}
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">everywhere</span>
            </h1>
            <p className={`mt-1.5 text-sm ${muted}`}>Apni photo ya AgentForge creation choose karo, caption likho, time set karo — bas.</p>
          </div>
          <button
            type="button"
            onClick={() => openComposer()}
            className={`hidden items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black sm:inline-flex ${primaryBtn}`}
          >
            <Plus className="h-4 w-4" /> Schedule post
          </button>
        </header>

        <nav className="mt-5 flex gap-2">
          {TABS.map((t) => {
            const active = pathname === t.href;
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : ghostBtn}`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4">{children}</div>
      </div>

      {/* Mobile: one big clear action, placed left of the site's chat bubble */}
      <button
        type="button"
        onClick={() => openComposer()}
        className={`fixed bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-black sm:hidden ${primaryBtn}`}
      >
        <Plus className="h-4 w-4" /> Schedule post
      </button>
    </main>
  );
}
