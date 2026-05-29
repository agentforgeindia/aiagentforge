"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";
import { identify, track } from "@/lib/analytics";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  credits: number;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data);
        setCredits(data.credits || 0);

        // Attach durable user metadata to all subsequent analytics
        // events (GA4 user_id, Clarity identify). Safe to call on
        // every profile refresh — trackers de-dup internally.
        identify({
          userId: userId,
          email: data.email ?? null,
          plan: data.plan ?? "free",
        });

        // Redirect if phone number missing
        if (!data.phone && pathname !== "/complete-profile") {
          router.push("/complete-profile");
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id);
        }
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id);
          // Track auth funnel events at the source of truth so we
          // capture both email + OAuth flows without duplicating
          // call sites in every form.
          if (event === "SIGNED_IN") {
            track({
              name: "login",
              method:
                session.user.app_metadata?.provider === "email"
                  ? "email"
                  : session.user.app_metadata?.provider ?? "unknown",
            });
          }
        } else {
          setUser(null);
          setProfile(null);
          setCredits(0);
        }

        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, credits, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}