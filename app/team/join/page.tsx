"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

function JoinContent() {
  const { darkMode } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "joining" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [teamName, setTeamName] = useState("");

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode ? "border-white/10 bg-white/[0.07] shadow-black/40" : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMsg("Invalid invite link — no token found.");
    }
  }, [token]);

  async function handleJoin() {
    if (!token) return;
    setStatus("joining");
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      // Redirect to login, come back after
      const returnUrl = encodeURIComponent(window.location.href);
      router.push(`/login?next=${returnUrl}`);
      return;
    }

    const res = await fetch("/api/team/join", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ token }),
    });
    const json = await res.json();

    if (res.ok) {
      setTeamName(json.team?.name ?? "the team");
      setStatus("success");
    } else {
      setStatus("error");
      setMsg(json.error || "Failed to join team.");
    }
  }

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className={`w-full max-w-md rounded-[2rem] border p-8 shadow-xl backdrop-blur-xl text-center ${card}`}>

          {status === "idle" && token && (
            <>
              <div className="mb-4 text-5xl">🤝</div>
              <h2 className="mb-2 text-2xl font-black">You're Invited!</h2>
              <p className={`mb-8 text-sm ${muted}`}>Click below to join your team on AgentForge and access shared credits for bulk generation.</p>
              <button
                onClick={handleJoin}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 py-4 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]"
              >
                Accept Invite & Join Team
              </button>
            </>
          )}

          {status === "joining" && (
            <>
              <div className="mb-4 text-5xl animate-spin">⚙️</div>
              <h2 className="text-2xl font-black">Joining...</h2>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-4 text-5xl">🎉</div>
              <h2 className="mb-2 text-2xl font-black">You're In!</h2>
              <p className={`mb-8 text-sm ${muted}`}>You've successfully joined <strong>{teamName}</strong>. Start using team credits for bulk generation.</p>
              <button
                onClick={() => router.push("/team")}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 py-4 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]"
              >
                Go to Team Dashboard
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-4 text-5xl">❌</div>
              <h2 className="mb-2 text-2xl font-black">Invite Error</h2>
              <p className={`mb-8 text-sm ${muted}`}>{msg}</p>
              <button
                onClick={() => router.push("/")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-black transition hover:bg-white/10"
              >
                Go Home
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  );
}
