"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import Navbar from "./Navbar";
import Footer from "./Footer";
import AnalyticsRouteTracker from "./AnalyticsRouteTracker";
import UtmCapture from "./UtmCapture";
import LaunchOfferPopup from "./LaunchOfferPopup";

const PhonePromptPopup = dynamic(() => import("./PhonePromptPopup"), {
  ssr: false,
  loading: () => null,
});

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
  // Invoice / bill download pages render plain — no navbar, footer,
  // chat or popup — so the browser's "Save as PDF" produces a clean,
  // single-page document.
  const isInvoicePage = pathname.startsWith("/invoice");
  // Admin panel uses its own AdminShell — site navbar/footer would
  // overlap and break layout.
  const isAdminPage = pathname.startsWith("/admin");

  const hideChrome =
    isWorkshopPage || isAuthPage || isInvoicePage || isAdminPage;

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

      {!hideChrome && <Navbar />}

      {children}

      {!hideChrome && <Footer />}
      {!hideChrome && <AgentForgeAI />}
      {!hideChrome && <LaunchOfferPopup />}
      {!hideChrome && <PhonePromptPopup />}
    </>
  );
}