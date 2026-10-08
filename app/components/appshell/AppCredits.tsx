"use client";

// Credits screen — shown at "/billing" and "/pricing" inside the
// Android app (while APP_PURCHASES_ENABLED is false, lib/appMode.ts).
//
// Credit packs are sold here through Google Play Billing — Play Store
// does not allow another checkout for digital credits inside an app.
// Flow: Google Play payment sheet → /api/play-billing/verify checks the
// purchase with Google and adds the credits → balance refreshes.
//
// The three packs and their prices are always listed here, also for
// people who are not logged in. When Google Play has the packs
// (app installed from Play Store, products created in Play Console)
// the price comes from Play and each pack gets a Buy button. Until
// then the website list price is shown with a note on how to buy.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, RefreshCw, Zap } from "lucide-react";

import { useAuth } from "@/app/components/AuthProvider";
import {
  buyPlayProduct,
  finishPlayPurchase,
  getOpenPlayPurchases,
  getPlayProducts,
  isPlayBillingAvailable,
  type PlayPurchase,
  type PlayStoreProduct,
} from "@/lib/native";
import { PLAY_PRODUCTS } from "@/lib/playBilling";
import { supabase } from "@/lib/supabase";
import { OfferTicket, useAppContent } from "./AppPromos";
import { useCountUp } from "./useCountUp";
import { PRICE_TABLE } from "@/lib/creditPricing";

type Notice = { kind: "ok" | "info" | "error"; text: string };

const card =
  "rounded-3xl border border-black/8 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]";

/** What each pack includes — same wording as the website pricing page. */
const PACK_DETAILS: Record<string, { popular?: boolean; features: string[] }> = {
  credits_starter_1800: {
    features: ["All AgentForge agents", "HD 1080×1080 images, no watermark", "Your shop name and contact on images"],
  },
  credits_pro_9000: {
    popular: true,
    features: ["Everything in Starter", "Bulk generation, many designs at once", "Faster queue and premium shoot styles"],
  },
  credits_empire_36000: {
    features: ["Everything in Pro Creator", "Free branding on all outputs", "Priority queue and setup guidance"],
  },
};

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export default function AppCredits() {
  const { user, profile, credits, loading, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [storeProducts, setStoreProducts] = useState<PlayStoreProduct[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const shownCredits = useCountUp(credits);
  const promos = useAppContent(loading ? null : !!user);

  const userId = user?.id;

  // Always call the latest refreshProfile without re-running the effects below.
  const refreshRef = useRef(refreshProfile);
  useEffect(() => {
    refreshRef.current = refreshProfile;
  }, [refreshProfile]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  /** Sends a paid purchase to the server, which checks it with Google and adds the credits. */
  const settle = useCallback(async (purchase: PlayPurchase, opts: { quiet?: boolean } = {}) => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const jwt = sess.session?.access_token;
      const res = await fetch("/api/play-billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ productId: purchase.productId, purchaseToken: purchase.purchaseToken }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        pending?: boolean;
        alreadyProcessed?: boolean;
        creditsAdded?: number;
        error?: string;
      };

      if (json.pending) {
        setNotice({ kind: "info", text: "Payment is still pending. Your credits are added as soon as Google Play confirms it." });
        return;
      }
      if (!res.ok || !json.success) {
        if (!opts.quiet) {
          setNotice({
            kind: "error",
            text: `${json.error || "We could not confirm the purchase yet."} Open this screen again in a minute — you will not be charged twice.`,
          });
        }
        return;
      }

      // Credits are in — let Google Play know the pack was used, then show the new balance.
      await finishPlayPurchase(purchase.purchaseToken);
      await refreshRef.current();
      if (!json.alreadyProcessed) {
        setNotice({ kind: "ok", text: `${(json.creditsAdded ?? 0).toLocaleString("en-IN")} credits added to your account.` });
      }
    } catch {
      if (!opts.quiet) {
        setNotice({
          kind: "error",
          text: "No internet while confirming the purchase. Open this screen again when you are online — you will not be charged twice.",
        });
      }
    }
  }, []);

  // Load packs from Google Play, and finish any purchase that was paid
  // but not completed (app closed mid-way, slow payment that came through).
  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      if (!(await isPlayBillingAvailable())) return;
      const products = await getPlayProducts(PLAY_PRODUCTS.map((p) => p.productId));
      if (!active) return;
      setStoreProducts(products);
      const open = await getOpenPlayPurchases();
      for (const purchase of open) {
        if (!active) return;
        if (purchase.purchased) await settle(purchase, { quiet: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, settle]);

  const buy = async (productId: string) => {
    if (!userId || buying) return;
    setBuying(productId);
    setNotice(null);
    try {
      const result = await buyPlayProduct(productId, userId);
      if (result.ok) {
        if (result.purchase.purchased) await settle(result.purchase);
        else setNotice({ kind: "info", text: "Payment is still pending. Your credits are added as soon as Google Play confirms it." });
        return;
      }
      if (result.cancelled) return;
      if (result.alreadyOwned) {
        // Paid earlier but never finished — finish it now instead of failing.
        const open = await getOpenPlayPurchases();
        const mine = open.find((p) => p.productId === productId && p.purchased);
        if (mine) {
          await settle(mine);
          return;
        }
      }
      setNotice({ kind: "error", text: result.message });
    } finally {
      setBuying(null);
    }
  };

  // Every pack is always listed. `storePrice` is set once Google Play has it.
  const packs = PLAY_PRODUCTS.map((pack) => ({
    ...pack,
    ...PACK_DETAILS[pack.productId],
    storePrice: storeProducts.find((s) => s.productId === pack.productId)?.priceString,
  }));
  const playReady = packs.some((pack) => pack.storePrice);

  return (
    <main className="relative mx-auto w-full max-w-xl flex-1 px-4 pb-6 pt-4 text-[#111827] dark:text-white">
      {user ? (
        <section className="af-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-600/25">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15" />
          <div className="relative">
            <p className="text-sm font-semibold text-white/80">Your credit balance</p>
            <p className="mt-2 flex items-center gap-2 text-5xl font-black leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
              <Zap className="h-8 w-8 fill-current" />
              {shownCredits.toLocaleString("en-IN")}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">{String(profile?.plan || "Free")} plan</p>
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="flex h-9 items-center gap-1.5 rounded-full bg-white/20 px-3.5 text-[13px] font-black transition active:scale-95 disabled:opacity-70"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </section>
      ) : (
        !loading && (
          <section className="af-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-5 text-white shadow-xl shadow-indigo-600/30">
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative">
              <h2 className="text-xl font-black leading-tight">Start with 100 free credits</h2>
              <p className="mt-1.5 text-sm leading-6 text-white/85">Sign up first. Buy a pack only when you need more.</p>
              <div className="mt-4 flex items-center gap-5">
                <Link
                  href="/signup"
                  className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-white text-sm font-black text-indigo-700 shadow-lg shadow-black/20 transition active:scale-[0.98]"
                >
                  Sign up free
                </Link>
                <Link href="/login" className="pr-2 text-sm font-black text-white underline decoration-white/50 underline-offset-4">
                  Login
                </Link>
              </div>
            </div>
          </section>
        )
      )}

      {notice && (
        <p
          role="status"
          className={`af-rise mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold leading-6 ${
            notice.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : notice.kind === "info"
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-100"
                : "border-black/15 bg-black/[0.04] text-[#111827] dark:border-white/20 dark:bg-white/10 dark:text-white"
          }`}
        >
          {notice.kind === "ok" && <Check className="mt-1 h-4 w-4 shrink-0" />}
          <span>{notice.text}</span>
        </p>
      )}

      {/* ───────── Live offers from the admin panel ───────── */}
      {promos.offers.length > 0 && (
        <div className="mt-4 grid gap-3">
          {promos.offers.map((offer) => (
            <OfferTicket key={offer.id} item={offer} />
          ))}
        </div>
      )}

      {/* ───────── Pricing ───────── */}
      <div className="af-rise mb-3 mt-6" style={step(1)}>
        <h2 className="text-lg font-black">Credit packs</h2>
        <p className="mt-0.5 text-[13px] text-black/55 dark:text-white/55">{PRICE_TABLE.premium} credits make 1 standard HD image.</p>
      </div>
      <div className="grid gap-3">
        {packs.map((pack, i) => (
          <article
            key={pack.productId}
            style={step(i + 2)}
            className={`af-rise relative p-4 ${card} ${pack.popular ? "border-cyan-400 ring-1 ring-cyan-400/60 dark:border-cyan-400/70" : ""}`}
          >
            {pack.popular && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1 text-[11px] font-black text-white shadow-md shadow-cyan-500/30">
                Most popular
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-black leading-tight">{pack.plan}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-[15px] font-black text-cyan-700 dark:text-cyan-300" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <Zap className="h-4 w-4 fill-current" />
                  {pack.credits.toLocaleString("en-IN")} credits
                </p>
              </div>
              <p className="shrink-0 text-right text-2xl font-black leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                {pack.storePrice || rupees(pack.amount)}
              </p>
            </div>
            <p className="mt-2 text-[13px] font-semibold text-black/60 dark:text-white/60">
              Up to {Math.floor(pack.credits / 15).toLocaleString("en-IN")} standard images
            </p>
            <ul className="mt-3 grid gap-1.5 text-[13px] leading-5 text-black/65 dark:text-white/65">
              {pack.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
                  {feature}
                </li>
              ))}
            </ul>
            {user && pack.storePrice && (
              <button
                type="button"
                onClick={() => buy(pack.productId)}
                disabled={buying !== null}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition active:scale-[0.98] disabled:opacity-60"
              >
                {buying === pack.productId ? "Please wait…" : `Buy for ${pack.storePrice}`}
              </button>
            )}
          </article>
        ))}
      </div>

      {playReady ? (
        <p className="mt-3 text-center text-xs font-semibold text-black/45 dark:text-white/45">
          {user ? "Paid through Google Play. Credits are added right after payment." : "Login to buy. Paid through Google Play."}
        </p>
      ) : (
        <section className={`af-reveal mt-3 p-4 ${card}`}>
          <h2 className="text-sm font-black">How to buy right now</h2>
          <p className="mt-1.5 text-[13px] leading-5 text-black/60 dark:text-white/60">
            Buying inside the app opens when this app is live on Google Play. Until then, open{" "}
            <span className="font-black text-[#111827] dark:text-white">aiagentforge.in</span> in your browser, log in with
            this same account and buy a pack. The credits show here, tap Refresh.
          </p>
        </section>
      )}

      <section className={`af-reveal mt-4 p-5 ${card}`}>
        <h2 className="text-base font-black">How credits work</h2>
        <ul className="mt-3 grid gap-2.5 text-sm leading-6 text-black/60 dark:text-white/60">
          <li>Every image you generate uses credits from this balance.</li>
          <li>If a generation fails, its credits are returned automatically.</li>
          <li>Credits are shared across the app and the website.</li>
        </ul>
      </section>
    </main>
  );
}
