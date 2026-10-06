"use client";

// ============================================================
// AppShell — wraps the page content in LayoutClient
// ============================================================
// On the website (active = false) this renders the page exactly
// as before. Inside the Android app (active = true) it adds the
// app top bar + bottom tabs, and swaps a few website pages for
// app-style screens (home, agents, creations, credits).
//
// The app-only parts are loaded on demand, so website visitors
// never download them.
// ============================================================

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { APP_PURCHASES_ENABLED } from "@/lib/appMode";
import { matchesRoute } from "./appData";

const AppTopBar = dynamic(() => import("./AppTopBar"), { ssr: false, loading: () => null });
const AppBottom = dynamic(() => import("./AppBottom"), { ssr: false, loading: () => null });
const AppScreen = dynamic(() => import("./AppScreen"), { ssr: false, loading: () => null });
const AppIntro = dynamic(() => import("./AppIntro"), { ssr: false, loading: () => null });

/** Pages that keep their own full-screen layout even inside the app. */
const BARE_ROUTES = ["/admin", "/workshop", "/onsite-training", "/invoice", "/auth"];

/** Website pages that get an app-style screen instead. */
function isReplacedRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "/agents" || pathname === "/my-creations") return true;
  if (!APP_PURCHASES_ENABLED && (pathname === "/pricing" || pathname === "/billing")) return true;
  return false;
}

export default function AppShell({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const on = active && !matchesRoute(pathname, BARE_ROUTES);
  const replaced = isReplacedRoute(pathname);

  // Keep three fixed slots so the page itself is never re-mounted
  // when app mode switches on after hydration.
  return (
    <>
      {on ? <AppTopBar /> : null}
      {replaced ? (
        on ? (
          <AppScreen pathname={pathname} />
        ) : (
          // "contents" = no layout box on the website; hidden by CSS
          // before first paint inside the app (.af-app .af-web-only).
          <div className="af-web-only contents">{children}</div>
        )
      ) : (
        children
      )}
      {on ? <AppBottom /> : null}
      {/* First-launch intro (shows itself only once, on the home screen). */}
      {on ? <AppIntro /> : null}
    </>
  );
}
