"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import Navbar from "./Navbar";
import Footer from "./Footer";
import AnalyticsRouteTracker from "./AnalyticsRouteTracker";
import UtmCapture from "./UtmCapture";
import LaunchOfferPopup from "./LaunchOfferPopup";

// Floating chat — 286 lines, not SEO-critical, only useful after
// the user shows intent. Dynamic-import + ssr:false keeps it out
// of the initial JS payload on every page (cuts a few hundred KB
// of JS the user never interacts with on most visits).
const AgentForgeAI = dynamic(() => import("./AgentForgeAI"), {
  ssr: false,
  loading: () => null,
});

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();

  const isWorkshopPage = pathname.startsWith("/workshop");
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  return (
    <>
      {/* Route-change page_view tracker. useSearchParams must be
          wrapped in <Suspense> per Next.js 16 docs — otherwise
          the whole tree opts out of static rendering. */}
      <Suspense fallback={null}>
        <AnalyticsRouteTracker />
      </Suspense>

      {/* Captures utm_* params on landing → localStorage. Wrapped
          in Suspense because useSearchParams must be (Next 16). */}
      <Suspense fallback={null}>
        <UtmCapture />
      </Suspense>

      {!isWorkshopPage && !isAuthPage && <Navbar />}

      {children}

      {!isWorkshopPage && !isAuthPage && <Footer />}
      {!isWorkshopPage && !isAuthPage && <AgentForgeAI />}
      {!isWorkshopPage && !isAuthPage && <LaunchOfferPopup />}
    </>
  );
}