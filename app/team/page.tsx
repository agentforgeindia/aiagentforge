"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

interface Team {
  id: string;
  name: string;
  credits: number;
  plan: string;
  role: string;
}

interface MemberStat {
  user_id: string;
  role: string;
  joined_at: string;
  email: string | null;
  full_name: string | null;
  personal_credits: number;
  personal_plan: string;
  team_credits_used: number;
  last_used_at: string | null;
}

interface MyStats {
  team_credits: number;
  team_credits_used_by_me: number;
  personal_credits: number;
  personal_plan: string;
  plan_expires_at: string | null;
  recent_team_usage: { delta: number; reason: string; created_at: string }[];
}

export default function TeamPage() {
  const { darkMode } = useTheme();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  // Owner/admin stats
  const [memberStats, setMemberStats] = useState<MemberStat[]>([]);
  // Member self stats
  const [myStats, setMyStats] = useState<MyStats | null>(null);

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode ? "border-white/10 bg-white/[0.07] shadow-black/40" : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const softCard = darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70";
  const input = darkMode
    ? "border-white/10 bg-white/5 text-white placeholder:text-white/30"
    : "border-black/10 bg-white text-black placeholder:text-black/30";

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function loadTeam() {
    const token = await getToken();
    if (!token) { setLoading(false); return; }

    const res = await fetch("/api/team/me", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();

    if (json.teams?.length > 0) {
      const t = json.teams[0];
      setTeam(t);

      // Load stats for this team
      const sRes = await fetch(`/api/team/stats?team_id=${t.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sJson = await sRes.json();

      if (["owner", "admin"].includes(t.role)) {
        setMemberStats(sJson.member_stats ?? []);
        // Update team credits from stats response
        setTeam((prev) => prev ? { ...prev, credits: sJson.team_credits ?? prev.credits } : prev);
      } else {
        setMyStats(sJson);
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadTeam(); }, []);

  async function handleCreateTeam() {
    if (!teamName.trim()) return;
    setCreating(true);
    setMsg(null);
    const token = await getToken();
    const res = await fetch("/api/team/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: teamName }),
    });
    const json = await res.json();
    setCreating(false);
    if (res.ok) { setMsg({ text: "Team created!", ok: true }); loadTeam(); }
    else setMsg({ text: json.error || "Failed.", ok: false });
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !team) return;
    setMsg(null);
    const token = await getToken();
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ team_id: team.id, email: inviteEmail, role: "member" }),
    });
    const json = await res.json();
    if (res.ok) {
      setInviteUrl(json.invite?.invite_url ?? "");
      setMsg({ text: "Invite sent! Share the link below.", ok: true });
      setInviteEmail("");
    } else {
      setMsg({ text: json.error || "Failed.", ok: false });
    }
  }

  async function handleTopup() {
    const amount = Number(topupAmount);
    if (!amount || amount <= 0 || !team) return;
    setMsg(null);
    const token = await getToken();
    const res = await fetch("/api/team/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ team_id: team.id, amount }),
    });
    const json = await res.json();
    if (res.ok) {
      setMsg({ text: `${amount} credits team pool mein add ho gaye!`, ok: true });
      setTopupAmount("");
      loadTeam();
    } else {
      setMsg({ text: json.error || "Failed.", ok: false });
    }
  }

  async function handleEditName() {
    if (!team || !editName.trim()) return;
    setMsg(null);
    const token = await getToken();
    const res = await fetch("/api/team/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ team_id: team.id, name: editName }),
    });
    const json = await res.json();
    if (res.ok) {
      setMsg({ text: "Team name updated!", ok: true });
      setEditingName(false);
      setTeam({ ...team, name: editName });
    } else {
      setMsg({ text: json.error || "Failed.", ok: false });
    }
  }

  async function handleRemove(userId: string) {
    if (!team || !confirm("Remove this member?")) return;
    const token = await getToken();
    const res = await fetch("/api/team/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ team_id: team.id, user_id: userId }),
    });
    if (res.ok) loadTeam();
  }

  const isOwnerOrAdmin = team?.role === "owner" || team?.role === "admin";

  function fmtDate(d: string | null) {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  const totalTeamUsed = memberStats.reduce((s, m) => s + m.team_credits_used, 0);

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">👥</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">🤝</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-slow absolute right-[20%] top-[8%] text-3xl opacity-55 sm:text-4xl">💎</div>
        <div className="float-medium absolute left-[4%] top-[40%] text-3xl opacity-50 sm:text-4xl">🚀</div>
        <div className="float-fast absolute right-[5%] top-[50%] text-3xl opacity-50 sm:text-4xl">⚡</div>
      </div>

      <div className="relative z-10">
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-14 md:py-20">

          {/* Header */}
          <div className="mb-8 text-center sm:mb-10">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold text-cyan-600 sm:mb-5 sm:px-5 sm:py-2 sm:text-sm">
              Team Access
            </div>
            <h2 className="text-3xl font-black sm:text-4xl md:text-5xl">Your Team</h2>
            <p className={`mt-3 text-sm sm:text-base ${muted}`}>
              {!team
                ? "Create a team, invite members, and share credits for bulk generation."
                : isOwnerOrAdmin
                ? "Manage your team, invite members, and top up the shared credit pool."
                : "You're part of a team! Use team credits to run bulk generation on Jewellery AI, Textile AI, and Productography — without spending your personal balance."}
            </p>
          </div>

          {msg && (
            <div className={`mb-5 rounded-2xl px-5 py-3.5 text-sm font-semibold ${msg.ok ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
              {msg.text}
            </div>
          )}

          {loading ? (
            <div className={`text-center py-20 ${muted}`}>Loading...</div>
          ) : !team ? (
            /* ── Create Team ── */
            <div className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl md:p-8 ${card}`}>
              <h3 className="mb-2 text-xl font-black">Create a Team</h3>
              <p className={`mb-6 text-sm ${muted}`}>Create one to invite members and share credits.</p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Team name (e.g. My Studio)"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-cyan-400/60 ${input}`}
                />
                <button
                  onClick={handleCreateTeam}
                  disabled={creating || !teamName.trim()}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Team"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Team Overview ── */}
              <div className={`mb-5 rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl md:p-8 ${card}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`flex-1 rounded-xl border px-3 py-2 text-lg font-black outline-none focus:border-cyan-400/60 ${input}`}
                          autoFocus
                        />
                        <button onClick={handleEditName} className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-white hover:bg-cyan-600">Save</button>
                        <button onClick={() => setEditingName(false)} className={`rounded-xl border px-4 py-2 text-xs font-black ${softCard}`}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black">{team.name}</h3>
                        {team.role === "owner" && (
                          <button
                            onClick={() => { setEditName(team.name); setEditingName(true); }}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition hover:border-cyan-400/40 hover:text-cyan-500 ${softCard}`}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                    <span className={`mt-1 inline-block text-xs font-bold uppercase tracking-widest ${muted}`}>
                      Your role: {team.role}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black text-cyan-500">{team.credits.toLocaleString()}</div>
                    <div className={`text-xs font-semibold uppercase tracking-widest ${muted}`}>Team Credits Left</div>
                  </div>
                </div>

                {/* Owner summary bar */}
                {isOwnerOrAdmin && memberStats.length > 0 && (
                  <div className={`mt-5 grid grid-cols-3 gap-3 rounded-2xl border p-4 ${softCard}`}>
                    <div className="text-center">
                      <div className="text-xl font-black text-violet-400">{memberStats.length}</div>
                      <div className={`text-xs font-semibold ${muted}`}>Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-black text-rose-400">{totalTeamUsed.toLocaleString()}</div>
                      <div className={`text-xs font-semibold ${muted}`}>Total Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-black text-emerald-400">{team.credits.toLocaleString()}</div>
                      <div className={`text-xs font-semibold ${muted}`}>Remaining</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Member Credit View (non-owner) ── */}
              {!isOwnerOrAdmin && myStats && (
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Personal Credits */}
                  <div className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl ${card}`}>
                    <div className={`mb-1 text-xs font-bold uppercase tracking-widest ${muted}`}>Personal Credits</div>
                    <div className="text-3xl font-black text-emerald-500">{myStats.personal_credits.toLocaleString()}</div>
                    <div className={`mt-1 text-xs font-semibold ${muted}`}>
                      Plan: <span className="font-black capitalize">{myStats.personal_plan || "Free"}</span>
                    </div>
                    {myStats.plan_expires_at && (
                      <div className={`mt-1 text-xs ${muted}`}>Expires: {fmtDate(myStats.plan_expires_at)}</div>
                    )}
                    <p className={`mt-3 text-xs ${muted}`}>These are your own credits from your personal plan purchase.</p>
                  </div>

                  {/* Team Credits */}
                  <div className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl ${card}`}>
                    <div className={`mb-1 text-xs font-bold uppercase tracking-widest ${muted}`}>Team Credits</div>
                    <div className="text-3xl font-black text-cyan-500">{myStats.team_credits.toLocaleString()}</div>
                    <div className={`mt-1 text-xs font-semibold ${muted}`}>
                      You've used: <span className="font-black text-rose-400">{myStats.team_credits_used_by_me.toLocaleString()}</span>
                    </div>
                    <p className={`mt-3 text-xs ${muted}`}>Shared pool by team owner. Use these for bulk generation without touching your personal balance.</p>
                  </div>
                </div>
              )}

              {/* Member's recent team usage */}
              {!isOwnerOrAdmin && myStats && myStats.recent_team_usage.length > 0 && (
                <div className={`mb-5 rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl md:p-8 ${card}`}>
                  <h3 className="mb-4 text-lg font-black">My Team Credit Usage</h3>
                  <div className="space-y-2">
                    {myStats.recent_team_usage.slice(0, 10).map((t, i) => (
                      <div key={i} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${softCard}`}>
                        <div>
                          <p className={`text-xs font-semibold ${muted}`}>{t.reason.replace(/_/g, " ")}</p>
                          <p className={`text-xs ${muted}`}>{fmtDate(t.created_at)}</p>
                        </div>
                        <span className="text-sm font-black text-rose-400">−{Math.abs(t.delta)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Top-up Credits (owner only) ── */}
              {team.role === "owner" && (
                <div className={`mb-5 rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl md:p-8 ${card}`}>
                  <h3 className="mb-1 text-lg font-black">Add Credits to Team Pool</h3>
                  <p className={`mb-5 text-sm ${muted}`}>Transfer from your personal balance to the shared team pool.</p>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="Credits to transfer"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      className={`flex-1 rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-cyan-400/60 ${input}`}
                    />
                    <button
                      onClick={handleTopup}
                      disabled={!topupAmount || Number(topupAmount) <= 0}
                      className="rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* ── Invite Member (owner/admin only) ── */}
              {isOwnerOrAdmin && (
                <div className={`mb-5 rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl md:p-8 ${card}`}>
                  <h3 className="mb-1 text-lg font-black">Invite Member</h3>
                  <p className={`mb-5 text-sm ${muted}`}>Send an invite link — valid for 7 days.</p>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      placeholder="member@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className={`flex-1 rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-cyan-400/60 ${input}`}
                    />
                    <button
                      onClick={handleInvite}
                      disabled={!inviteEmail.trim()}
                      className="rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-50"
                    >
                      Invite
                    </button>
                  </div>
                  {inviteUrl && (
                    <div className={`mt-4 rounded-2xl border p-4 ${softCard}`}>
                      <p className={`mb-2 text-xs font-bold uppercase tracking-widest ${muted}`}>Invite Link</p>
                      <div className="flex items-center gap-3">
                        <p className="flex-1 break-all text-xs font-semibold text-cyan-500">{inviteUrl}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(inviteUrl); setMsg({ text: "Link copied!", ok: true }); }}
                          className="shrink-0 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-500 transition hover:bg-cyan-400/20"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Members List (owner/admin) with usage stats ── */}
              {isOwnerOrAdmin && (
                <div className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl md:p-8 ${card}`}>
                  <h3 className="mb-5 text-lg font-black">Members & Credit Usage</h3>
                  <div className="space-y-3">
                    {memberStats.map((m) => (
                      <div key={m.user_id} className={`rounded-2xl border p-4 ${softCard}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-black">{m.full_name || m.email || m.user_id}</p>
                            <p className={`truncate text-xs ${muted}`}>{m.email}</p>
                            <p className={`mt-0.5 text-xs ${muted}`}>Joined: {fmtDate(m.joined_at)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest ${
                              m.role === "owner"
                                ? "border-violet-400/30 bg-violet-400/10 text-violet-400"
                                : m.role === "admin"
                                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-500"
                                : darkMode ? "border-white/10 bg-white/5 text-white/50" : "border-black/10 bg-black/5 text-black/50"
                            }`}>
                              {m.role}
                            </span>
                            {m.role !== "owner" && (
                              <button
                                onClick={() => handleRemove(m.user_id)}
                                className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-400 transition hover:bg-red-500/20"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Credit usage row */}
                        <div className={`mt-3 grid grid-cols-3 gap-2 rounded-xl border p-3 text-center ${darkMode ? "border-white/5 bg-white/[0.03]" : "border-black/5 bg-black/[0.02]"}`}>
                          <div>
                            <div className="text-sm font-black text-rose-400">{m.team_credits_used.toLocaleString()}</div>
                            <div className={`text-[10px] font-semibold ${muted}`}>Team Credits Used</div>
                          </div>
                          <div>
                            <div className="text-sm font-black text-emerald-400">{m.personal_credits.toLocaleString()}</div>
                            <div className={`text-[10px] font-semibold ${muted}`}>Personal Credits</div>
                          </div>
                          <div>
                            <div className={`text-sm font-black ${muted}`}>{m.last_used_at ? fmtDate(m.last_used_at) : "Never"}</div>
                            <div className={`text-[10px] font-semibold ${muted}`}>Last Active</div>
                          </div>
                        </div>

                        {/* Personal plan badge */}
                        {m.personal_plan && m.personal_plan !== "free" && (
                          <div className="mt-2">
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-500">
                              Own Plan: {m.personal_plan}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
