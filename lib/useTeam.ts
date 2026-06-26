"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface TeamInfo {
  id: string;
  name: string;
  credits: number;
  plan: string;
  role: string;
}

export function useTeam() {
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) { setLoading(false); return; }

      const res = await fetch("/api/team/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setLoading(false); return; }
      const json = await res.json();
      if (!cancelled && json.teams?.length > 0) {
        setTeam(json.teams[0]);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { team, loading };
}
