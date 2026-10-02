"use client";

// Picks the app-style screen for the website routes that are
// replaced inside the Android app (see AppShell.isReplacedRoute).

import AppAgents from "./AppAgents";
import AppCreations from "./AppCreations";
import AppCredits from "./AppCredits";
import AppHome from "./AppHome";

export default function AppScreen({ pathname }: { pathname: string }) {
  if (pathname === "/agents") return <AppAgents />;
  if (pathname === "/my-creations") return <AppCreations />;
  if (pathname === "/pricing" || pathname === "/billing") return <AppCredits />;
  return <AppHome />;
}
