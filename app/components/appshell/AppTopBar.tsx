"use client";

// App top bar — only rendered inside the Android app.

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Zap } from "lucide-react";

import { useAuth } from "@/app/components/AuthProvider";
import NotificationBell from "@/app/components/NotificationBell";
import { appTitleFor } from "./appData";

const ROOT_TABS = ["/", "/agents", "/my-creations", "/billing"];
const AUTH_SCREENS = ["/login", "/signup"];

export default function AppTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, credits, loading } = useAuth();

  const isRoot = ROOT_TABS.includes(pathname);
  const isAuthScreen = AUTH_SCREENS.includes(pathname);
  const title = appTitleFor(pathname);

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-[#fff8e8]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#070b14]/90">
      <div className="flex h-14 items-center gap-2 px-3">
        {isRoot ? (
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src="/af-logo.png"
              alt="AgentForge"
              width={36}
              height={36}
              sizes="36px"
              className="h-9 w-9 shrink-0 rounded-xl"
            />
            <span className="truncate bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-lg font-black text-transparent">
              {pathname === "/" ? "AgentForge" : title}
            </span>
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#111827] transition active:scale-95 active:bg-black/5 dark:text-white dark:active:bg-white/10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="min-w-0 truncate text-base font-black text-[#111827] dark:text-white">{title}</h1>
          </>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <Link
                href="/billing"
                aria-label={`${credits} credits`}
                className="flex h-9 items-center gap-1 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 text-cyan-700 transition active:scale-95 dark:text-cyan-200"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span className="text-[13px] font-black" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {credits.toLocaleString("en-IN")}
                </span>
              </Link>
              <NotificationBell />
            </>
          ) : !loading && !isAuthScreen ? (
            <Link
              href="/login"
              className="flex h-9 items-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 text-[13px] font-black text-white shadow-md shadow-cyan-500/25 transition active:scale-95"
            >
              Login
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
