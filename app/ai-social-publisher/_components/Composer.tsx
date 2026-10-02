"use client";

// Create / edit a post — Meta-planner style composer (PREVIEW).
// Only existing content: upload from phone/PC gallery or pick from
// My AgentForge creations. No AI generation on this page.

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { X, ImagePlus, Sparkles, Trash2, CalendarClock, Send, Save, Check, Heart, MessageCircle, Bookmark, ThumbsUp, Share2 } from "lucide-react";
import { CAPTION_LIMIT, PLATFORM_NAME, type Media, type Post, type Account } from "./data";
import { useStyles, usePublisherStore, AccountAvatar, PlatformIcon, toLocalInput } from "./ui";
import CreationsPicker from "./CreationsPicker";

export default function Composer() {
  const { composer, closeComposer, accounts, upsertPost } = usePublisherStore();
  if (!composer.open) return null;
  return <ComposerInner key={composer.editing?.id ?? "new"} editing={composer.editing} presetDate={composer.presetDate} accounts={accounts} onClose={closeComposer} onSave={upsertPost} />;
}

function ComposerInner({
  editing,
  presetDate,
  accounts,
  onClose,
  onSave,
}: {
  editing: Post | null;
  presetDate: Date | null;
  accounts: Account[];
  onClose: () => void;
  onSave: (p: Post) => void;
}) {
  const { darkMode, muted, input, ghostBtn, primaryBtn, selected, line } = useStyles();

  const initialWhen = (() => {
    if (editing?.at) return new Date(editing.at);
    if (presetDate) {
      const d = new Date(presetDate);
      d.setHours(11, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(11, 0, 0, 0);
    return d;
  })();

  const [accountIds, setAccountIds] = useState<string[]>(editing?.accountIds ?? accounts.filter((a) => a.status === "connected").slice(0, 1).map((a) => a.id));
  const [media, setMedia] = useState<Media[]>(editing?.media ?? []);
  const [caption, setCaption] = useState(editing?.caption ?? "");
  const [when, setWhen] = useState<"now" | "schedule">("schedule");
  const [date, setDate] = useState(toLocalInput(initialWhen).date);
  const [time, setTime] = useState(toLocalInput(initialWhen).time);
  const [picker, setPicker] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);

  const chosen = accounts.filter((a) => accountIds.includes(a.id));
  const limit = chosen.length ? Math.min(...chosen.map((a) => CAPTION_LIMIT[a.platform])) : 2200;
  const previewPlatform = chosen[0]?.platform === "facebook" ? "facebook" : "instagram";
  const [previewAs, setPreviewAs] = useState<"instagram" | "facebook">(previewPlatform);

  const scheduledAt = useMemo(() => new Date(`${date}T${time}`), [date, time]);
  const inPast = when === "schedule" && scheduledAt.getTime() < openedAt;
  const canSubmit = accountIds.length > 0 && media.length > 0 && caption.length <= limit && !(when === "schedule" && (!date || !time || inPast));

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10 - media.length);
    setMedia((m) => [
      ...m,
      ...files.map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), source: "device" as const, kind: f.type.startsWith("video") ? ("video" as const) : ("image" as const) })),
    ]);
    e.target.value = "";
  };

  const save = (status: Post["status"]) => {
    onSave({
      id: editing?.id ?? crypto.randomUUID(),
      caption,
      media,
      accountIds,
      at: status === "draft" && when === "now" ? null : scheduledAt.toISOString(),
      status,
    });
    onClose();
  };

  const primary = () => {
    if (when === "now") {
      setNotice("Preview mode: turant publish Meta account connect hone ke baad chalega.");
      return;
    }
    save("scheduled");
  };

  const first = media[0];
  const previewAccount = chosen.find((a) => a.platform === previewAs) ?? chosen[0];

  return (
    <div className="fixed inset-0 z-[110] flex items-stretch justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex h-full w-full max-w-5xl flex-col overflow-hidden border shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-3xl ${
          darkMode ? "border-white/10 bg-[#0b1220] text-white" : "border-black/10 bg-[#fffdf7] text-slate-900"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${line}`}>
          <h2 className="text-lg font-black">{editing ? "Edit post" : "Create post"}</h2>
          <button type="button" onClick={onClose} className={`rounded-full p-2 ${ghostBtn}`} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.15fr_0.85fr]">
          {/* ── Left: form ── */}
          <div className="space-y-6 p-5">
            {/* 1. Post to */}
            <section>
              <SectionTitle n={1} title="Post to" />
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => {
                  const on = accountIds.includes(a.id);
                  const broken = a.status === "needs_reauth";
                  return (
                    <button
                      key={a.id}
                      type="button"
                      disabled={broken}
                      title={broken ? "Reconnect required" : undefined}
                      onClick={() => setAccountIds((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))}
                      className={`inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${on ? selected : ghostBtn}`}
                    >
                      <AccountAvatar account={a} size="sm" />
                      {a.name}
                      {on && <Check className="h-3.5 w-3.5 text-cyan-600" />}
                    </button>
                  );
                })}
                <Link href="/ai-social-publisher/accounts" onClick={onClose} className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold text-blue-600 hover:underline`}>
                  + Connect account
                </Link>
              </div>
            </section>

            {/* 2. Media */}
            <section>
              <SectionTitle n={2} title="Photo / video" />
              {media.length === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-4 transition hover:border-cyan-400 ${darkMode ? "border-white/15" : "border-black/15 bg-white"}`}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
                      <ImagePlus className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-black">Upload from gallery</span>
                      <span className={`block text-xs ${muted}`}>Phone / computer se photo ya video</span>
                    </span>
                    <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={addFiles} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setPicker(true)}
                    className={`flex items-center gap-3 rounded-2xl border-2 border-dashed p-4 text-left transition hover:border-cyan-400 ${darkMode ? "border-white/15" : "border-black/15 bg-white"}`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-black">My AgentForge creations</span>
                      <span className={`block text-xs ${muted}`}>Jo AgentForge pe banaya hai</span>
                    </span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {media.map((m, i) => (
                      <div key={m.id} className="group relative h-24 w-24 overflow-hidden rounded-xl bg-black/5">
                        {m.kind === "video" ? (
                          <video src={m.url} className="h-full w-full object-cover" muted />
                        ) : (
                          <img src={m.url} alt="" className="h-full w-full object-cover" />
                        )}
                        {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white">Cover</span>}
                        <button
                          type="button"
                          onClick={() => setMedia((p) => p.filter((x) => x.id !== m.id))}
                          className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {media.length < 10 && (
                      <div className="flex h-24 w-24 flex-col gap-1">
                        <label className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl text-[11px] font-bold ${ghostBtn}`}>
                          + Gallery
                          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={addFiles} />
                        </label>
                        <button type="button" onClick={() => setPicker(true)} className={`flex flex-1 items-center justify-center rounded-xl text-[11px] font-bold ${ghostBtn}`}>
                          + Creations
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={`mt-2 text-xs ${muted}`}>
                    {media.length > 1 ? `${media.length} items — carousel ki tarah post hoga.` : "Size har platform ke hisaab se apne aap fit ho jayega."}
                  </p>
                </div>
              )}
            </section>

            {/* 3. Caption */}
            <section>
              <SectionTitle n={3} title="Caption" />
              <textarea
                className={`${input} min-h-[130px]`}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Apna caption aur hashtags yahan likho…"
              />
              <p className={`mt-1 text-right text-[11px] font-semibold ${caption.length > limit ? "text-violet-600" : muted}`}>
                {caption.length}/{limit}
              </p>
            </section>

            {/* 4. When */}
            <section>
              <SectionTitle n={4} title="Kab post karna hai?" />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setWhen("now")} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold ${when === "now" ? selected : ghostBtn}`}>
                  <Send className="h-4 w-4" /> Abhi post karo
                </button>
                <button type="button" onClick={() => setWhen("schedule")} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold ${when === "schedule" ? selected : ghostBtn}`}>
                  <CalendarClock className="h-4 w-4" /> Schedule
                </button>
              </div>
              {when === "schedule" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} />
                  <input type="time" className={input} value={time} onChange={(e) => setTime(e.target.value)} />
                  <p className={`col-span-2 text-xs ${inPast ? "font-bold text-violet-600" : muted}`}>
                    {inPast ? "Ye time nikal chuka hai — aage ka time choose karo." : "India time (IST)"}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* ── Right: preview ── */}
          <div className={`border-t p-5 lg:border-l lg:border-t-0 ${line} ${darkMode ? "bg-white/[0.02]" : "bg-slate-50/70"}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black">Preview</p>
              <div className={`inline-flex rounded-full p-0.5 ${darkMode ? "bg-white/10" : "bg-black/5"}`}>
                {(["instagram", "facebook"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreviewAs(p)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${previewAs === p ? (darkMode ? "bg-white/15" : "bg-white shadow-sm") : muted}`}
                  >
                    <PlatformIcon id={p} size="xs" /> {PLATFORM_NAME[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className={`mx-auto max-w-[340px] overflow-hidden rounded-2xl border shadow-sm ${darkMode ? "border-white/10 bg-[#0f172a]" : "border-black/10 bg-white"}`}>
              <div className="flex items-center gap-2 p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white">
                  {(previewAccount?.name ?? "Y").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black">{previewAccount?.name ?? "your_account"}</p>
                  <p className={`text-[10px] ${muted}`}>{previewAs === "facebook" ? "Just now" : "Instagram"}</p>
                </div>
              </div>
              {previewAs === "facebook" && caption && <p className="whitespace-pre-line px-3 pb-2 text-xs">{caption}</p>}
              <div className={`relative ${previewAs === "instagram" ? "aspect-[4/5]" : "aspect-square"} bg-black/5`}>
                {first ? (
                  first.kind === "video" ? (
                    <video src={first.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <img src={first.url} alt="" className="h-full w-full object-cover" />
                  )
                ) : (
                  <div className={`flex h-full items-center justify-center text-xs ${muted}`}>Photo add karo</div>
                )}
                {media.length > 1 && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white">1/{media.length}</span>
                )}
              </div>
              {previewAs === "instagram" ? (
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5" />
                    <MessageCircle className="h-5 w-5" />
                    <Send className="h-5 w-5" />
                    <Bookmark className="ml-auto h-5 w-5" />
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs">
                    <span className="font-black">{previewAccount?.name ?? "your_account"}</span> {caption || <span className={muted}>Caption yahan dikhega</span>}
                  </p>
                </div>
              ) : (
                <div className={`flex justify-around border-t p-2 text-[11px] font-bold ${line} ${muted}`}>
                  <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Like</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Comment</span>
                  <span className="inline-flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Share</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex flex-col gap-2 border-t px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between ${line}`}>
          <p className={`text-xs font-semibold ${notice ? "text-blue-600" : muted}`}>
            {notice ??
              (accountIds.length === 0
                ? "Kam se kam ek account choose karo."
                : media.length === 0
                  ? "Ek photo ya video add karo."
                  : `${accountIds.length} account${accountIds.length > 1 ? "s" : ""} par jayega.`)}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => save("draft")} disabled={media.length === 0} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold disabled:opacity-40 sm:flex-none ${ghostBtn}`}>
              <Save className="h-4 w-4" /> Save draft
            </button>
            <button type="button" onClick={primary} disabled={!canSubmit} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black sm:flex-none ${primaryBtn}`}>
              {when === "now" ? <Send className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
              {when === "now" ? "Publish now" : "Schedule post"}
            </button>
          </div>
        </div>
      </div>

      {picker && (
        <CreationsPicker
          onClose={() => setPicker(false)}
          onAdd={(items) => {
            setMedia((m) => [...m, ...items.map((it) => ({ id: `${it.id}-${Date.now()}`, url: it.url, source: "creation" as const, kind: "image" as const }))].slice(0, 10));
            setPicker(false);
          }}
        />
      )}
    </div>
  );
}

function SectionTitle({ n, title }: { n: number; title: string }) {
  return (
    <p className="mb-2.5 flex items-center gap-2 text-sm font-black">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">{n}</span>
      {title}
    </p>
  );
}
