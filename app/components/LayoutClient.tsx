"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import Navbar from "./Navbar";
import Footer from "./Footer";
import AgentForgeAI from "./AgentForgeAI";
import AnalyticsRouteTracker from "./AnalyticsRouteTracker";
import LaunchOfferPopup from "./LaunchOfferPopup";

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

      {!isWorkshopPage && !isAuthPage && <Navbar />}

      {children}

      {!isWorkshopPage && !isAuthPage && <Footer />}
      {!isWorkshopPage && !isAuthPage && <AgentForgeAI />}
      {!isWorkshopPage && !isAuthPage && <LaunchOfferPopup />}
    </>
  );
}