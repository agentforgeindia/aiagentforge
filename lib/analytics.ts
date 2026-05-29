// ============================================================
// AgentForge analytics helper — single typed entry point.
// ============================================================
// Fires events to whatever tracker is loaded:
//   • Google Analytics 4   (window.gtag)
//   • Google Ads           (window.gtag, conversion-only events)
//   • Meta Pixel           (window.fbq)
//   • Microsoft Clarity    (window.clarity)
//
// All targets are best-effort. If a script hasn't loaded yet
// (e.g. dev mode, no env vars set) the call is a silent no-op
// so call sites stay clean.
//
// Usage from client components:
//
//   import { track, identify } from "@/lib/analytics";
//
//   track({ name: "generation_started", agent: "jewellery", credits: 75 });
//   identify({ userId: user.id, plan: profile.plan });
// ============================================================

// ────────────────────────────────────────────────────────────
// Window typings — keep this file self-contained.
// ────────────────────────────────────────────────────────────
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// ────────────────────────────────────────────────────────────
// Typed event catalog — every event the app fires lives here.
// Adding a new event = adding a branch + (optionally) a Meta
// Pixel mapping below.
// ────────────────────────────────────────────────────────────

export type AgentName =
  | "jewellery"
  | "textile"
  | "productography"
  | "ugc-forge"
  | "trendforge"
  | "election-campaign";

export type AnalyticsEvent =
  /** Fired by AnalyticsRouteTracker on every App Router pathname change. */
  | { name: "page_view"; path: string; title?: string }

  /* ───── Auth funnel ───── */
  | { name: "sign_up"; method?: "email" | "google" | "github" | string }
  | { name: "login"; method?: "email" | "google" | "github" | string }

  /* ───── Commerce funnel ───── */
  | { name: "view_pricing" }
  | {
      name: "begin_checkout";
      plan: string;
      value: number;
      currency?: string;
    }
  | {
      name: "purchase";
      transaction_id: string;
      value: number;
      plan: string;
      currency?: string;
    }

  /* ───── Generation funnel ───── */
  | { name: "generation_started"; agent: AgentName; credits: number }
  | {
      name: "generation_completed";
      agent: AgentName;
      generation_id: string;
      duration_ms?: number;
    }
  | {
      name: "generation_failed";
      agent: AgentName;
      reason?: string;
      stage?: "upload" | "deduct" | "n8n" | "polling" | "unknown";
    }
  | {
      name: "insufficient_credits";
      agent: AgentName;
      required: number;
    }

  /* ───── Content engagement ───── */
  | { name: "blog_post_read"; slug: string; category?: string }
  | { name: "cta_click"; cta: string; location?: string }

  /* ───── Catch-all (don't overuse) ───── */
  | { name: "custom_event"; event_name: string; props?: Record<string, unknown> };

/** Plain object passed to gtag — pulls out the `name` field. */
function paramsOf(ev: AnalyticsEvent): Record<string, unknown> {
  const { name: _ignored, ...rest } = ev as Record<string, unknown> & {
    name: string;
  };
  return rest;
}

// ────────────────────────────────────────────────────────────
// Meta Pixel mapping
// ────────────────────────────────────────────────────────────
// Meta has a fixed list of "standard" events that drive better
// auto-optimization. Anything else gets sent via trackCustom.
// ────────────────────────────────────────────────────────────
function metaName(ev: AnalyticsEvent): {
  kind: "standard" | "custom";
  name: string;
  payload?: Record<string, unknown>;
} {
  switch (ev.name) {
    case "sign_up":
      return { kind: "standard", name: "CompleteRegistration" };
    case "login":
      return { kind: "custom", name: "Login" };
    case "view_pricing":
      return { kind: "standard", name: "ViewContent", payload: { content_name: "Pricing" } };
    case "begin_checkout":
      return {
        kind: "standard",
        name: "InitiateCheckout",
        payload: { value: ev.value, currency: ev.currency ?? "INR", content_name: ev.plan },
      };
    case "purchase":
      return {
        kind: "standard",
        name: "Purchase",
        payload: {
          value: ev.value,
          currency: ev.currency ?? "INR",
          content_name: ev.plan,
          content_ids: [ev.transaction_id],
        },
      };
    case "generation_started":
      return {
        kind: "custom",
        name: "GenerationStarted",
        payload: { agent: ev.agent, credits: ev.credits },
      };
    case "generation_completed":
      return {
        kind: "custom",
        name: "GenerationCompleted",
        payload: { agent: ev.agent },
      };
    case "insufficient_credits":
      return {
        kind: "custom",
        name: "InsufficientCredits",
        payload: { agent: ev.agent, required: ev.required },
      };
    case "blog_post_read":
      return {
        kind: "standard",
        name: "ViewContent",
        payload: { content_type: "blog_post", content_name: ev.slug },
      };
    case "page_view":
      return { kind: "standard", name: "PageView" };
    default:
      return { kind: "custom", name: ev.name };
  }
}

// ────────────────────────────────────────────────────────────
// Main entry point
// ────────────────────────────────────────────────────────────

/**
 * Fire an analytics event to every loaded tracker.
 * Safe to call from any client component; SSR-safe (no-op).
 */
export function track(ev: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  // 1. GA4 (and Google Ads, since they share the same gtag).
  try {
    window.gtag?.("event", ev.name, paramsOf(ev));
  } catch {
    /* ignore */
  }

  // 2. Meta Pixel.
  try {
    if (window.fbq) {
      const m = metaName(ev);
      if (m.kind === "standard") {
        window.fbq("track", m.name, m.payload);
      } else {
        window.fbq("trackCustom", m.name, m.payload);
      }
    }
  } catch {
    /* ignore */
  }

  // 3. Microsoft Clarity — sends as a custom event tag so you can
  //    filter heatmaps / recordings by event later.
  try {
    window.clarity?.("event", ev.name);
  } catch {
    /* ignore */
  }
}

/**
 * Attach durable user metadata to the session (sent with every
 * subsequent event). Call this after login / on profile load.
 */
export function identify(opts: {
  userId: string;
  email?: string | null;
  plan?: string | null;
}): void {
  if (typeof window === "undefined") return;

  // GA4: user_id + user properties
  try {
    window.gtag?.("set", { user_id: opts.userId });
    if (opts.plan) {
      window.gtag?.("set", "user_properties", { plan: opts.plan });
    }
  } catch {
    /* ignore */
  }

  // Clarity: custom tags + identify the session
  try {
    window.clarity?.("identify", opts.userId);
    if (opts.plan) window.clarity?.("set", "plan", opts.plan);
  } catch {
    /* ignore */
  }
}

/**
 * Convenience for the legacy `gtag("event","conversion",…)` flow
 * the pricing/payment-success pages already use. Keeps a single
 * call site for Google Ads conversion reporting.
 */
export function reportAdsConversion(opts: {
  send_to: string;
  value: number;
  currency?: string;
  transaction_id?: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", "conversion", {
      send_to: opts.send_to,
      value: opts.value,
      currency: opts.currency ?? "INR",
      transaction_id: opts.transaction_id,
    });
  } catch {
    /* ignore */
  }
}
