"use client";

import { useSyncExternalStore } from "react";

import { isAppMode } from "@/lib/appMode";

const noopSubscribe = () => () => {};

/**
 * True when the site runs inside the AgentForge Android app.
 * Returns false on the server and during hydration, then the real
 * value — so the server HTML always matches.
 */
export function useAppMode(): boolean {
  return useSyncExternalStore(noopSubscribe, isAppMode, () => false);
}
