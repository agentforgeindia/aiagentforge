"use client";

// Banners and offers inside the Android app.
//
// The team manages them from Admin → App Content → Banners & Offers
// (table public.app_content, read through GET /api/app-content).
//
//   <BannerCarousel>  picture slides on the Home screen
//   <OfferTicket>     offer ticket on the Home and Credits screens
//   useAppContent()   loads the live items once and shares them
//
// The admin page draws its phone preview with these same components
// (preview = true → not clickable), so what the team sees while
// editing is exactly what users get.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { ChevronRight, Clock, Gift } from "lucide-react";

import {
  endsLabel,
  isExternalLink,
  isForAudience,
  type AppContentItem,
} from "@/lib/appContent";

// ───────────────────────── data ─────────────────────────

type AppContent = { banners: AppContentItem[]; offers: AppContentItem[] };

const EMPTY: AppContent = { banners: [], offers: [] };
const CACHE_KEY = "af_app_content_v1";
const FRESH_MS = 60_000;

// One small store shared by every screen, so Home and Credits do not
// each fetch, and both update together.
let current: AppContent = EMPTY;
let loadedAt = 0;
let loading = false;
let restored = false;
const listeners = new Set<() => void>();

function publish(next: AppContent) {
  current = next;
  listeners.forEach((listener) => listener());
}

function refresh() {
  // Show what was on screen last time at once (same app session).
  if (!restored) {
    restored = true;
    try {
      const saved = window.sessionStorage.getItem(CACHE_KEY);
      if (saved) publish(JSON.parse(saved) as AppContent);
    } catch {
      /* storage blocked — fine */
    }
  }
  if (loading || Date.now() - loadedAt < FRESH_MS) return;
  loading = true;
  fetch("/api/app-content", { cache: "no-store" })
    .then((res) => res.json())
    .then((json: Partial<AppContent>) => {
      const next: AppContent = {
        banners: Array.isArray(json.banners) ? json.banners : [],
        offers: Array.isArray(json.offers) ? json.offers : [],
      };
      loadedAt = Date.now();
      publish(next);
      try {
        window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {
        /* storage blocked — fine */
      }
    })
    .catch(() => {
      /* offline — keep what we have */
    })
    .finally(() => {
      loading = false;
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  refresh();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => current;
const getServerSnapshot = () => EMPTY;

/**
 * Live banners and offers for this person.
 * `loggedIn` = null while login state is still loading → nothing is
 * shown yet, so a "for new users" banner never flashes for a member.
 */
export function useAppContent(loggedIn: boolean | null): AppContent {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    if (loggedIn === null) return EMPTY;
    return {
      banners: data.banners.filter((item) => isForAudience(item.audience, loggedIn)),
      offers: data.offers.filter((item) => isForAudience(item.audience, loggedIn)),
    };
  }, [data, loggedIn]);
}

// ───────────────────────── shared ─────────────────────────

/** Makes the whole card tappable. In the admin preview it is a plain box. */
function PromoLink({
  item,
  preview,
  className,
  style,
  children,
}: {
  item: AppContentItem;
  preview?: boolean;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (preview || !item.link) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  if (isExternalLink(item.link)) {
    return (
      <a href={item.link} target="_blank" rel="noopener noreferrer" className={`${className} transition active:scale-[0.99]`} style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={item.link} className={`${className} transition active:scale-[0.99]`} style={style}>
      {children}
    </Link>
  );
}

// ───────────────────────── banners ─────────────────────────

function BannerSlide({ item, preview, wide }: { item: AppContentItem; preview?: boolean; wide: boolean }) {
  const hasText = item.show_text || !item.image_url;
  return (
    <PromoLink
      item={item}
      preview={preview}
      className={`relative block aspect-[16/9] shrink-0 snap-center overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 shadow-lg shadow-indigo-900/15 ${
        wide ? "w-full" : "w-[88%]"
      }`}
    >
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={hasText ? "" : item.title} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {hasText && (
        <div
          className={`absolute inset-0 flex flex-col justify-end p-3.5 text-white ${
            item.image_url ? "bg-gradient-to-t from-black/85 via-black/55 to-black/5" : ""
          }`}
        >
          <p className="line-clamp-2 shrink-0 text-lg font-black leading-tight [text-wrap:balance]">{item.title}</p>
          {item.body && <p className="mt-1 line-clamp-2 shrink-0 text-[13px] leading-[1.35] text-white/85">{item.body}</p>}
          {item.cta_label && item.link && (
            <span className="mt-2 flex h-8 w-fit shrink-0 items-center gap-0.5 rounded-full bg-white pl-3.5 pr-2 text-[13px] font-black text-indigo-700">
              {item.cta_label}
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </PromoLink>
  );
}

/** Scroll position that puts slide `i` in the middle of the rail. */
function centerOf(el: HTMLDivElement, i: number): number {
  const slide = el.children[i] as HTMLElement | undefined;
  if (!slide) return 0;
  return slide.offsetLeft - el.offsetLeft - (el.clientWidth - slide.clientWidth) / 2;
}

/** The slide closest to the middle right now. */
function nearest(el: HTMLDivElement): number {
  let best = 0;
  let bestGap = Infinity;
  for (let i = 0; i < el.children.length; i++) {
    const gap = Math.abs(centerOf(el, i) - el.scrollLeft);
    if (gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  }
  return best;
}

/** Home screen banners. One banner = one card; several = a swipeable row. */
export function BannerCarousel({ items, preview }: { items: AppContentItem[]; preview?: boolean }) {
  const rail = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const [index, setIndex] = useState(0);
  const count = items.length;

  // Which slide is in view → the dots.
  const onScroll = () => {
    const el = rail.current;
    if (el && count > 1) setIndex(nearest(el));
  };

  // Move to the next slide every few seconds, until the person touches it.
  useEffect(() => {
    if (count < 2 || preview) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      const el = rail.current;
      if (!el || touched.current || document.hidden) return;
      const next = (nearest(el) + 1) % count;
      el.scrollTo({ left: centerOf(el, next), behavior: "smooth" });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [count, preview]);

  if (count === 0) return null;

  return (
    <section aria-label="Announcements" className="af-rise mt-4">
      <div
        ref={rail}
        onScroll={onScroll}
        onPointerDown={() => {
          touched.current = true;
        }}
        className={`scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto ${preview ? "" : "-mx-4 px-4"}`}
      >
        {items.map((item) => (
          <BannerSlide key={item.id} item={item} preview={preview} wide={count === 1} />
        ))}
      </div>
      {count > 1 && (
        <div aria-hidden className="mt-2.5 flex justify-center gap-1.5">
          {items.map((item, i) => (
            <span
              key={item.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-5 bg-blue-600 dark:bg-cyan-300" : "w-1.5 bg-black/15 dark:bg-white/25"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ───────────────────────── offers ─────────────────────────

const STUB_WIDTH = 92;
const NOTCH = 9;

/** Two round bites out of the ticket, where the stub tears off. */
const ticketMask = (() => {
  const x = `calc(100% - ${STUB_WIDTH}px)`;
  const hole = (y: string) => `radial-gradient(circle ${NOTCH}px at ${x} ${y}, #0000 97%, #000)`;
  const mask = `${hole("0")} top / 100% 51% no-repeat, ${hole("100%")} bottom / 100% 51% no-repeat`;
  return { WebkitMask: mask, mask } as CSSProperties;
})();

/** An offer, drawn as a ticket: details on the left, highlight on the stub. */
export function OfferTicket({ item, preview, className = "" }: { item: AppContentItem; preview?: boolean; className?: string }) {
  const ends = endsLabel(item.ends_at);
  return (
    <div className={`af-rise drop-shadow-[0_6px_14px_rgba(15,23,42,0.12)] ${className}`}>
      <PromoLink
        item={item}
        preview={preview}
        style={ticketMask}
        className="flex min-h-[104px] overflow-hidden rounded-3xl bg-white text-[#111827] dark:bg-[#17233b] dark:text-white"
      >
        <div className="flex min-w-0 flex-1 flex-col justify-center py-3.5 pl-4 pr-4">
          <p className="text-[17px] font-black leading-tight [text-wrap:balance]">{item.title}</p>
          {item.body && <p className="mt-1 text-[13px] leading-5 text-black/60 dark:text-white/65">{item.body}</p>}
          {(ends || (item.cta_label && item.link)) && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-black">
              {item.cta_label && item.link && (
                <span className="flex items-center text-teal-700 dark:text-teal-300">
                  {item.cta_label}
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
              {ends && (
                <span className="flex items-center gap-1 font-semibold text-black/50 dark:text-white/55">
                  <Clock className="h-3.5 w-3.5" />
                  {ends}
                </span>
              )}
            </p>
          )}
        </div>
        <div
          className="flex shrink-0 flex-col items-center justify-center gap-1 border-l-2 border-dashed border-white/60 bg-gradient-to-br from-emerald-500 to-teal-600 px-2 text-center text-white"
          style={{ width: STUB_WIDTH }}
        >
          {item.badge ? (
            <span className="text-[19px] font-black leading-[1.05] [overflow-wrap:anywhere] [text-wrap:balance]">{item.badge}</span>
          ) : (
            <Gift className="h-8 w-8" />
          )}
        </div>
      </PromoLink>
    </div>
  );
}
