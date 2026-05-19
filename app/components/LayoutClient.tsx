"use client";

import { usePathname } from "next/navigation";

import Navbar from "./Navbar";
import Footer from "./Footer";
import AgentForgeAI from "./AgentForgeAI";
import LaunchOfferPopup from "./LaunchOfferPopup";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();

  const isWorkshopPage =
    pathname === "/workshop";

  return (
    <>
      {!isWorkshopPage && <Navbar />}

      {children}

      {!isWorkshopPage && <Footer />}
      {!isWorkshopPage && <AgentForgeAI />}
      {!isWorkshopPage && <LaunchOfferPopup />}
    </>
  );
}