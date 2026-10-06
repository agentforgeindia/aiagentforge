// ============================================================
// Client source — where a generation was started from
// ============================================================
// Saved on every generations row (column `client_source`) so the
// admin panel can show whether a user works from the mobile app, a
// phone browser or the desktop website.
//
//   "app"        — the AgentForge app (Android now, iOS later). The
//                  app shell appends "AgentForgeApp/<version>" to the
//                  user-agent (mobile/capacitor.config.json).
//   "mobile_web" — a phone / tablet browser on aiagentforge.in.
//   "web"        — a desktop / laptop browser.
//
// Detected on the SERVER from request headers — the browser is never
// asked, so a page cannot forget to send it. Every route that inserts
// into `generations` must add `client_source: detectClientSource(request)`.
// ============================================================

import { APP_UA_TOKEN } from "@/lib/appMode";

export type ClientSource = "app" | "mobile_web" | "web";

const MOBILE_UA = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini|Mobile/i;

export function detectClientSource(request: Request): ClientSource {
  const ua = request.headers.get("user-agent") ?? "";
  if (ua.includes(APP_UA_TOKEN)) return "app";
  // Chromium also sends an explicit "is this a phone" hint.
  if (request.headers.get("sec-ch-ua-mobile") === "?1") return "mobile_web";
  if (MOBILE_UA.test(ua)) return "mobile_web";
  return "web";
}
