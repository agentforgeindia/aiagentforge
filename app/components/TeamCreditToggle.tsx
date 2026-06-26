"use client";

import { useTeam } from "@/lib/useTeam";

interface Props {
  useTeamCredits: boolean;
  onChange: (val: boolean, teamId: string | null) => void;
  darkMode: boolean;
}

export default function TeamCreditToggle({ useTeamCredits, onChange, darkMode }: Props) {
  const { team, loading } = useTeam();

  if (loading || !team) return null;

  const card = darkMode
    ? "border-white/10 bg-white/[0.05]"
    : "border-black/10 bg-white/80";

  return (
    <div className={`mb-4 flex items-center justify-between rounded-2xl border px-4 py-3 ${card}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-lg">👥</span>
        <div>
          <p className={`text-xs font-black ${darkMode ? "text-white" : "text-black"}`}>
            {useTeamCredits ? `Using Team Credits — ${team.name}` : "Use Team Credits?"}
          </p>
          <p className={`text-[11px] font-semibold ${darkMode ? "text-white/45" : "text-black/45"}`}>
            {useTeamCredits
              ? `Pool balance: ${team.credits.toLocaleString()} credits`
              : `${team.name} · ${team.credits.toLocaleString()} credits available`}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!useTeamCredits, useTeamCredits ? null : team.id)}
        className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
          useTeamCredits ? "bg-cyan-500" : darkMode ? "bg-white/15" : "bg-black/15"
        }`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
            useTeamCredits ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
