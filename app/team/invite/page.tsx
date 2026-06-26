"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Invite functionality is on /team page itself
export default function TeamInviteRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/team"); }, [router]);
  return null;
}
