"use client";

// ============================================================
// /admin/app-content — banners and offers shown inside the app.
// ============================================================
// Banners → picture slides on the app Home screen.
// Offers  → offer tickets on the app Home and Credits screens.
//
// Saved through /api/admin/app-content (permission checked on the
// server). The phone preview uses the same components the app uses
// (app/components/appshell/AppPromos.tsx), so it is what users see.
//
// Training: lesson "app-content" in app/admin/training/lessons.ts.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { BannerCarousel, OfferTicket } from "@/app/components/appshell/AppPromos";
import {
  APP_CONTENT_LIMITS,
  APP_CONTENT_MAX,
  appContentStatus,
  cleanAppLink,
  isExternalLink,
  type AppContentAudience,
  type AppContentItem,
  type AppContentKind,
  type AppContentRow,
  type AppContentStatus,
} from "@/lib/appContent";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { useAdminLang } from "../i18n";

type T = (en: string, hi: string) => string;

/** Pages an item can open. "custom" = type another page or link. */
const LINKS: { value: string; en: string; hi: string }[] = [
  { value: "", en: "Nothing — it is not tappable", hi: "Kuch nahi — tap nahi hoga" },
  { value: "/billing", en: "Credits screen (buy packs)", hi: "Credits screen (pack kharidna)" },
  { value: "/agents", en: "Agents list", hi: "Agents ki list" },
  { value: "/textileprints-to-mockup", en: "Textile agent", hi: "Textile agent" },
  { value: "/jewellery-ai", en: "Jewellery agent", hi: "Jewellery agent" },
  { value: "/productography-ai", en: "Product agent", hi: "Product agent" },
  { value: "/gallery", en: "Gallery", hi: "Gallery" },
  { value: "/signup", en: "Sign up page", hi: "Sign up page" },
  { value: "custom", en: "Another page or link…", hi: "Koi aur page ya link…" },
];

const AUDIENCES: { value: AppContentAudience; en: string; hi: string }[] = [
  { value: "all", en: "Everyone", hi: "Sabko" },
  { value: "guests", en: "Only people who are not logged in", hi: "Sirf jo login nahi hain" },
  { value: "members", en: "Only logged-in users", hi: "Sirf login users ko" },
];

type Draft = {
  id: string | null;
  kind: AppContentKind;
  title: string;
  body: string;
  badge: string;
  cta_label: string;
  linkChoice: string;
  customLink: string;
  show_text: boolean;
  audience: AppContentAudience;
  starts: string;
  ends: string;
  is_active: boolean;
  image: File | null;
  imagePreview: string | null;
  removeImage: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO time → value for <input type="datetime-local"> in the admin's own time zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : "";
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function newDraft(kind: AppContentKind): Draft {
  return {
    id: null,
    kind,
    title: "",
    body: "",
    badge: "",
    cta_label: kind === "offer" ? "Buy credits" : "",
    linkChoice: kind === "offer" ? "/billing" : "",
    customLink: "",
    show_text: true,
    audience: "all",
    starts: "",
    ends: "",
    is_active: true,
    image: null,
    imagePreview: null,
    removeImage: false,
  };
}

function draftFrom(row: AppContentRow): Draft {
  const preset = LINKS.some((l) => l.value === (row.link ?? "") && l.value !== "custom");
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body ?? "",
    badge: row.badge ?? "",
    cta_label: row.cta_label ?? "",
    linkChoice: preset ? (row.link ?? "") : "custom",
    customLink: preset ? "" : (row.link ?? ""),
    show_text: row.show_text,
    audience: row.audience,
    starts: toLocalInput(row.starts_at),
    ends: toLocalInput(row.ends_at),
    is_active: row.is_active,
    image: null,
    imagePreview: row.image_url,
    removeImage: false,
  };
}

const draftLink = (d: Draft) => (d.linkChoice === "custom" ? d.customLink.trim() : d.linkChoice);

/** The draft as the app would draw it (for the phone preview). */
function previewItem(d: Draft): AppContentItem {
  const link = cleanAppLink(draftLink(d));
  return {
    id: d.id ?? "preview",
    kind: d.kind,
    title: d.title.trim() || (d.kind === "banner" ? "Banner title" : "Offer title"),
    body: d.body.trim() || null,
    badge: d.badge.trim() || null,
    image_url: d.kind === "banner" ? d.imagePreview : null,
    cta_label: d.cta_label.trim() || null,
    link: link || null,
    show_text: d.show_text,
    audience: d.audience,
    starts_at: null,
    ends_at: fromLocalInput(d.ends) || null,
  };
}

const STATUS_STYLE: Record<AppContentStatus, string> = {
  live: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  scheduled: "bg-violet-50 text-violet-700 ring-violet-200",
  ended: "bg-slate-100 text-slate-600 ring-slate-200",
  paused: "bg-slate-100 text-slate-600 ring-slate-200",
};

function statusText(row: AppContentRow, t: T): string {
  const status = appContentStatus(row);
  if (status === "live") return row.ends_at ? t(`Live until ${when(row.ends_at)}`, `Live hai, ${when(row.ends_at)} tak`) : t("Live in the app", "App mein live hai");
  if (status === "scheduled") return t(`Starts ${when(row.starts_at!)}`, `${when(row.starts_at!)} se shuru hoga`);
  if (status === "ended") return t(`Ended ${when(row.ends_at!)}`, `${when(row.ends_at!)} ko khatam ho gaya`);
  return t("Paused — not showing", "Paused — nahi dikh raha");
}

export default function AdminAppContentPage() {
  const { loading: loadingAuth, isAdmin, email, has } = useAdminPermissions();
  const { lang } = useAdminLang();
  const t: T = useCallback((en, hi) => (lang === "hi" ? hi : en), [lang]);

  const canView = has("content.view");
  const canEdit = has("content.publish");
  const canDelete = has("content.delete");

  const [rows, setRows] = useState<AppContentRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<AppContentKind>("banner");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const authHeader = useCallback(async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
  }, []);

  useEffect(() => {
    if (!canView) return;
    let active = true;
    (async () => {
      const res = await fetch("/api/admin/app-content", { headers: await authHeader(), cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as { items?: AppContentRow[]; error?: string };
      if (!active) return;
      if (res.ok) {
        setRows(json.items ?? []);
        setLoadError(null);
      } else {
        setLoadError(json.error || "Could not load.");
      }
      setLoadingRows(false);
    })();
    return () => {
      active = false;
    };
  }, [canView, refreshKey, authHeader]);

  // Esc closes the editor.
  useEffect(() => {
    if (!draft) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) setDraft(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, saving]);

  const list = useMemo(() => rows.filter((r) => r.kind === tab), [rows, tab]);
  const liveCount = (kind: AppContentKind) => rows.filter((r) => r.kind === kind && appContentStatus(r) === "live").length;

  const say = (message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash((current) => (current === message ? null : current)), 5000);
  };

  const openNew = (kind: AppContentKind) => {
    setFormError(null);
    setDraft(newDraft(kind));
  };
  const openEdit = (row: AppContentRow) => {
    setFormError(null);
    setDraft(draftFrom(row));
  };
  const patchDraft = (change: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...change } : d));

  const pickImage = (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setFormError(t("Use a JPG, PNG or WebP picture.", "JPG, PNG ya WebP picture lagao."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError(t("The picture must be 5 MB or smaller.", "Picture 5 MB se chhoti honi chahiye."));
      return;
    }
    setFormError(null);
    patchDraft({ image: file, imagePreview: URL.createObjectURL(file), removeImage: false });
  };

  const save = async () => {
    if (!draft || saving) return;
    const link = draftLink(draft);
    if (!draft.title.trim()) return setFormError(t("Write a title.", "Title likho."));
    if (cleanAppLink(link) === false) {
      return setFormError(t("The link must be a page like /billing or a full https:// address.", "Link /billing jaisa page ya poora https:// address hona chahiye."));
    }
    if (draft.kind === "banner" && !draft.imagePreview && !draft.show_text) {
      return setFormError(t("Add a picture, or keep the text switched on.", "Picture lagao, ya text on rakho."));
    }
    if (draft.starts && draft.ends && new Date(draft.ends) <= new Date(draft.starts)) {
      return setFormError(t("The end must be after the start.", "End, start ke baad hona chahiye."));
    }

    setSaving(true);
    setFormError(null);
    try {
      const fd = new FormData();
      if (draft.id) fd.append("id", draft.id);
      else fd.append("kind", draft.kind);
      fd.append("title", draft.title);
      fd.append("body", draft.body);
      fd.append("badge", draft.kind === "offer" ? draft.badge : "");
      fd.append("cta_label", link ? draft.cta_label : "");
      fd.append("link", link);
      fd.append("show_text", String(draft.kind === "offer" ? true : draft.show_text));
      fd.append("audience", draft.audience);
      fd.append("starts_at", fromLocalInput(draft.starts));
      fd.append("ends_at", fromLocalInput(draft.ends));
      fd.append("is_active", String(draft.is_active));
      if (draft.kind === "banner") {
        if (draft.image) fd.append("image", draft.image);
        else if (draft.removeImage) fd.append("remove_image", "true");
      }

      const res = await fetch("/api/admin/app-content", {
        method: draft.id ? "PATCH" : "POST",
        headers: await authHeader(), // no Content-Type: the browser sets the form boundary
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(json.error || t("Could not save. Try again.", "Save nahi hua. Dobara try karo."));
        return;
      }
      const startsLater = !!draft.starts && new Date(draft.starts).getTime() > Date.now();
      setTab(draft.kind);
      setDraft(null);
      setRefreshKey((k) => k + 1);
      say(
        !draft.is_active
          ? t("Saved as paused. Press Resume when it should show.", "Paused save ho gaya. Dikhana ho tab Chalu karo dabao.")
          : startsLater
            ? t("Saved. It starts showing at the start time.", "Save ho gaya. Start time par dikhna shuru hoga.")
            : t("Saved. It shows in the app within a minute.", "Save ho gaya. Ek minute ke andar app mein dikhega."),
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePause = async (row: AppContentRow) => {
    setBusyId(row.id);
    const res = await fetch("/api/admin/app-content", {
      method: "PATCH",
      headers: { ...(await authHeader()), "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, is_active: !row.is_active }),
    });
    setBusyId(null);
    if (!res.ok) return say(t("Could not change it. Try again.", "Change nahi hua. Dobara try karo."));
    setRows((all) => all.map((r) => (r.id === row.id ? { ...r, is_active: !row.is_active } : r)));
    say(row.is_active ? t("Paused. It stops showing within a minute.", "Pause ho gaya. Ek minute mein dikhna band ho jayega.") : t("Resumed.", "Dobara chalu ho gaya."));
  };

  const move = async (row: AppContentRow, by: -1 | 1) => {
    const at = list.findIndex((r) => r.id === row.id);
    const to = at + by;
    if (at < 0 || to < 0 || to >= list.length) return;
    const next = [...list];
    [next[at], next[to]] = [next[to], next[at]];
    const order = next.map((r) => r.id);
    // Show the new order at once.
    setRows((all) => [
      ...all.filter((r) => r.kind !== tab),
      ...next.map((r, i) => ({ ...r, sort_order: i })),
    ]);
    const res = await fetch("/api/admin/app-content", {
      method: "PATCH",
      headers: { ...(await authHeader()), "Content-Type": "application/json" },
      body: JSON.stringify({ kind: tab, order }),
    });
    if (!res.ok) {
      say(t("Could not save the new order.", "Naya order save nahi hua."));
      setRefreshKey((k) => k + 1);
    }
  };

  const remove = async (row: AppContentRow) => {
    if (!window.confirm(t(`Delete “${row.title}”? This cannot be undone. To hide it for now, use Pause.`, `“${row.title}” delete karna hai? Ye wapas nahi aayega. Abhi ke liye chhupana ho to Pause use karo.`))) return;
    setBusyId(row.id);
    const res = await fetch(`/api/admin/app-content?id=${encodeURIComponent(row.id)}`, { method: "DELETE", headers: await authHeader() });
    setBusyId(null);
    if (!res.ok) return say(t("Could not delete it.", "Delete nahi hua."));
    setRows((all) => all.filter((r) => r.id !== row.id));
    say(t("Deleted.", "Delete ho gaya."));
  };

  if (loadingAuth) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500">Checking access…</main>;
  }
  if (!email || !isAdmin || !canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" />
          <h1 className="mt-3 text-base font-bold">{t("You cannot open this page", "Aap ye page nahi khol sakte")}</h1>
          <p className="mt-1 text-xs text-slate-500">
            {t("Your role needs the content.view permission. Ask the founder.", "Aapke role ko content.view permission chahiye. Founder se bolo.")}
          </p>
        </div>
      </main>
    );
  }

  const max = APP_CONTENT_MAX[tab];
  const liveHere = liveCount(tab);

  return (
    <AdminShell
      breadcrumbs={[{ label: t("App Content", "App Content") }, { label: t("Banners & Offers", "Banner aur Offer") }]}
      title={t("App banners & offers", "App ke banner aur offer")}
      subtitle={t("What users see on the app Home and Credits screens", "App ke Home aur Credits screen par user ko kya dikhega")}
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          {t("Refresh", "Refresh")}
        </button>
      }
    >
      {/* Which list + add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t("Content type", "Content ka type")} className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {(["banner", "offer"] as AppContentKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={tab === kind}
              onClick={() => setTab(kind)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${
                tab === kind ? "bg-[#020D23] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {kind === "banner" ? t("Banners", "Banners") : t("Offers", "Offers")}
              <span className={`ml-2 text-xs font-medium ${tab === kind ? "text-white/70" : "text-slate-400"}`}>
                {liveCount(kind)} {t("live", "live")}
              </span>
            </button>
          ))}
        </div>
        {canEdit && (
          <button type="button" onClick={() => openNew(tab)} className={adminPrimaryBtnCls}>
            <Plus className="h-4 w-4" />
            {tab === "banner" ? t("New banner", "Naya banner") : t("New offer", "Naya offer")}
          </button>
        )}
      </div>

      {/* Where it shows */}
      <p className={`mt-3 max-w-3xl text-[13px] leading-6 ${adminMutedCls}`}>
        {tab === "banner"
          ? t(
              `Banners show on the app Home screen, under the top card. With more than one, users swipe between them. Up to ${max} live banners are shown, in this order.`,
              `Banner app ke Home screen par, upar wale card ke neeche dikhte hain. Ek se zyada hon to user swipe karta hai. Zyada se zyada ${max} live banner dikhte hain, isi order mein.`,
            )
          : t(
              `The first live offer shows on the app Home screen; up to ${max} show on the Credits screen. An offer is a message only — it does not change prices or credits. Prices are set in Google Play Console.`,
              `Pehla live offer app ke Home par dikhta hai; Credits screen par zyada se zyada ${max}. Offer sirf ek message hai — isse price ya credits nahi badalte. Price Google Play Console mein set hoti hai.`,
            )}
      </p>
      {liveHere > max && (
        <p className="mt-2 rounded-xl bg-violet-50 px-3.5 py-2.5 text-[13px] font-medium text-violet-800">
          {t(`${liveHere} are live, but the app shows only the first ${max}. Pause the extra ones or move the important ones up.`, `${liveHere} live hain, par app sirf pehle ${max} dikhata hai. Extra wale pause karo ya zaroori wale upar le jao.`)}
        </p>
      )}

      {flash && (
        <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-800">
          {flash}
        </p>
      )}

      {/* List */}
      <div className={`${adminCardCls} mt-4 overflow-hidden`}>
        {loadingRows ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>{t("Loading…", "Load ho raha hai…")}</p>
        ) : loadError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-800">{t("Could not load the list", "List load nahi hui")}</p>
            <p className={`mx-auto mt-1 max-w-md text-[13px] leading-6 ${adminMutedCls}`}>{loadError}</p>
          </div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-800">
              {tab === "banner" ? t("No banners yet", "Abhi koi banner nahi hai") : t("No offers yet", "Abhi koi offer nahi hai")}
            </p>
            <p className={`mx-auto mt-1 max-w-sm text-[13px] leading-6 ${adminMutedCls}`}>
              {canEdit
                ? t("Add one — it shows in the app about a minute after you save.", "Ek add karo — save karne ke ek minute baad app mein dikhega.")
                : t("Your role can view this page but not add items.", "Aapka role ye page dekh sakta hai, add nahi kar sakta.")}
            </p>
            {canEdit && (
              <button type="button" onClick={() => openNew(tab)} className={`${adminPrimaryBtnCls} mt-4`}>
                <Plus className="h-4 w-4" />
                {tab === "banner" ? t("New banner", "Naya banner") : t("New offer", "Naya offer")}
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((row, i) => {
              const status = appContentStatus(row);
              const opens = LINKS.find((l) => l.value === (row.link ?? ""));
              const audience = AUDIENCES.find((a) => a.value === row.audience);
              const busy = busyId === row.id;
              return (
                <li key={row.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 ${busy ? "opacity-60" : ""}`}>
                  {/* Thumbnail */}
                  {row.kind === "banner" ? (
                    <div className="relative h-[54px] w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
                      {row.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="flex h-[54px] w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 px-1.5 text-center text-[13px] font-black leading-tight text-white">
                      {row.badge || t("Offer", "Offer")}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-sm font-bold text-slate-900">{row.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${STATUS_STYLE[status]}`}>{statusText(row, t)}</span>
                      <span>{audience ? t(audience.en, audience.hi) : row.audience}</span>
                      {row.link && (
                        <span className="truncate">
                          {t("Opens:", "Khulega:")} {opens ? t(opens.en, opens.hi) : row.link}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {canEdit && (
                      <>
                        <IconBtn label={t("Move up", "Upar karo")} disabled={i === 0 || busy} onClick={() => move(row, -1)}>
                          <ArrowUp className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label={t("Move down", "Neeche karo")} disabled={i === list.length - 1 || busy} onClick={() => move(row, 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </IconBtn>
                        <button type="button" disabled={busy} onClick={() => togglePause(row)} className={`${adminSecondaryBtnCls} !px-3 !py-2 text-[13px]`}>
                          {row.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          {row.is_active ? t("Pause", "Pause") : t("Resume", "Chalu karo")}
                        </button>
                        <button type="button" disabled={busy} onClick={() => openEdit(row)} className={`${adminSecondaryBtnCls} !px-3 !py-2 text-[13px]`}>
                          <Pencil className="h-3.5 w-3.5" />
                          {t("Edit", "Edit")}
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <IconBtn label={t("Delete", "Delete")} disabled={busy} onClick={() => remove(row)}>
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {draft && (
        <Editor
          draft={draft}
          t={t}
          saving={saving}
          error={formError}
          onChange={patchDraft}
          onPickImage={pickImage}
          onClose={() => !saving && setDraft(null)}
          onSave={save}
        />
      )}
    </AdminShell>
  );
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function Field({ label, hint, count, children }: { label: string; hint?: string; count?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-slate-800">{label}</span>
        {count && <span className="text-[11px] tabular-nums text-slate-400">{count}</span>}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1.5 block text-[12px] leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}

function Editor({
  draft,
  t,
  saving,
  error,
  onChange,
  onPickImage,
  onClose,
  onSave,
}: {
  draft: Draft;
  t: T;
  saving: boolean;
  error: string | null;
  onChange: (change: Partial<Draft>) => void;
  onPickImage: (file: File | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const isBanner = draft.kind === "banner";
  const link = draftLink(draft);
  const item = previewItem(draft);
  const L = APP_CONTENT_LIMITS;
  const heading = draft.id
    ? isBanner ? t("Edit banner", "Banner edit karo") : t("Edit offer", "Offer edit karo")
    : isBanner ? t("New banner", "Naya banner") : t("New offer", "Naya offer");

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/45 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={heading}>
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-base font-bold text-slate-900">{heading}</h2>
          <IconBtn label={t("Close", "Band karo")} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconBtn>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_340px]">
          {/* ── Form ── */}
          <div className="space-y-4 p-5">
            {isBanner && (
              <div>
                <p className="text-[13px] font-semibold text-slate-800">{t("Picture", "Picture")}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <label className={`${adminSecondaryBtnCls} cursor-pointer`}>
                    <ImageIcon className="h-4 w-4" />
                    {draft.imagePreview ? t("Change picture", "Picture badlo") : t("Choose picture", "Picture chuno")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="sr-only"
                      onChange={(e) => {
                        onPickImage(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {draft.imagePreview && (
                    <button type="button" onClick={() => onChange({ image: null, imagePreview: null, removeImage: true })} className={adminSecondaryBtnCls}>
                      <Trash2 className="h-4 w-4" />
                      {t("Remove picture", "Picture hatao")}
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                  {t("Best size 1280 × 720 (wide, 16:9). JPG, PNG or WebP, up to 5 MB. Without a picture the banner is a blue card with your text.", "Sabse achha size 1280 × 720 (chauda, 16:9). JPG, PNG ya WebP, 5 MB tak. Picture ke bina banner neela card banta hai jisme aapka text hota hai.")}
                </p>
              </div>
            )}

            {!isBanner && (
              <Field
                label={t("Highlight on the ticket", "Ticket par highlight")}
                count={`${draft.badge.length}/${L.badge}`}
                hint={t("Two or three short words, like “20% extra” or “Diwali offer”. Empty = a gift icon.", "Do-teen chhote shabd, jaise “20% extra” ya “Diwali offer”. Khali chhodo to gift icon aata hai.")}
              >
                <input className={adminInputCls} value={draft.badge} maxLength={L.badge} onChange={(e) => onChange({ badge: e.target.value })} placeholder="20% extra" />
              </Field>
            )}

            <Field
              label={t("Title", "Title")}
              count={`${draft.title.length}/${L.title}`}
              hint={isBanner && !draft.show_text ? t("Not shown on the picture. Used in this list and read out by screen readers.", "Picture par nahi dikhta. Is list mein aur screen reader ke liye kaam aata hai.") : undefined}
            >
              <input
                className={adminInputCls}
                value={draft.title}
                maxLength={L.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder={isBanner ? t("New: bulk generation for sarees", "Naya: sarees ke liye bulk generation") : t("Extra credits this week", "Is hafte extra credits")}
              />
            </Field>

            <Field label={t("Text (optional)", "Text (optional)")} count={`${draft.body.length}/${L.body}`}>
              <textarea className={`${adminInputCls} resize-none`} rows={2} value={draft.body} maxLength={L.body} onChange={(e) => onChange({ body: e.target.value })} />
            </Field>

            {isBanner && (
              <label className="flex items-start gap-2.5 text-[13px] text-slate-700">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-violet-600" checked={draft.show_text} onChange={(e) => onChange({ show_text: e.target.checked })} />
                <span>
                  <span className="font-semibold text-slate-800">{t("Show the title and text on the picture", "Title aur text picture ke upar dikhao")}</span>
                  <span className="block text-[12px] leading-5 text-slate-500">
                    {t("Switch off when the words are already part of your artwork.", "Agar shabd pehle se artwork mein likhe hain to band kar do.")}
                  </span>
                </span>
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("When tapped, open", "Tap karne par khulega")}>
                <select className={adminInputCls} value={draft.linkChoice} onChange={(e) => onChange({ linkChoice: e.target.value })}>
                  {LINKS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {t(l.en, l.hi)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Button text", "Button ka text")} count={`${draft.cta_label.length}/${L.cta}`}>
                <input
                  className={adminInputCls}
                  value={draft.cta_label}
                  maxLength={L.cta}
                  disabled={!link}
                  onChange={(e) => onChange({ cta_label: e.target.value })}
                  placeholder={t("Try it now", "Abhi try karo")}
                />
              </Field>
            </div>
            {draft.linkChoice === "custom" && (
              <Field label={t("Page or link", "Page ya link")} hint={t("A page of our site like /news, or a full https:// address.", "Hamari site ka page jaise /news, ya poora https:// address.")}>
                <input className={adminInputCls} value={draft.customLink} maxLength={L.link} onChange={(e) => onChange({ customLink: e.target.value })} placeholder="/news" />
              </Field>
            )}
            {isExternalLink(link) && (
              <p className="rounded-xl bg-violet-50 px-3.5 py-2.5 text-[12px] leading-5 text-violet-900">
                {t("This opens outside the app. Do not link to a page where credits are paid for — Google Play allows credit payments inside the app only through Google Play. For credit offers choose “Credits screen”.", "Ye app ke bahar khulega. Aise page ka link mat do jahan credits ka payment hota hai — Google Play app ke andar credits ka payment sirf Google Play se allow karta hai. Credit offer ke liye “Credits screen” chuno.")}
              </p>
            )}

            <Field label={t("Who sees it", "Kisko dikhega")}>
              <select className={adminInputCls} value={draft.audience} onChange={(e) => onChange({ audience: e.target.value as AppContentAudience })}>
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {t(a.en, a.hi)}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Start (optional)", "Start (optional)")} hint={t("Empty = starts now.", "Khali = abhi se shuru.")}>
                <input type="datetime-local" className={adminInputCls} value={draft.starts} onChange={(e) => onChange({ starts: e.target.value })} />
              </Field>
              <Field
                label={t("End (optional)", "End (optional)")}
                hint={isBanner ? t("Empty = stays until you pause it.", "Khali = jab tak aap pause na karo.") : t("It disappears by itself at this time. Users see “2 days left”.", "Is time par apne aap hat jayega. User ko “2 days left” dikhta hai.")}
              >
                <input type="datetime-local" className={adminInputCls} value={draft.ends} onChange={(e) => onChange({ ends: e.target.value })} />
              </Field>
            </div>

            <label className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-800">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-violet-600" checked={draft.is_active} onChange={(e) => onChange({ is_active: e.target.checked })} />
              {t("Active (untick to save it without showing it)", "Active (bina dikhaye save karna ho to tick hatao)")}
            </label>
          </div>

          {/* ── Phone preview ── */}
          <div className="border-t border-slate-200 bg-slate-50 p-5 md:border-l md:border-t-0">
            <p className="text-[13px] font-semibold text-slate-800">{t("How it looks in the app", "App mein kaisa dikhega")}</p>
            <div className="mx-auto mt-3 w-full max-w-[300px] rounded-[1.75rem] border-[6px] border-slate-800 bg-[#f4f7fb] p-3 text-[#111827]">
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-300" />
              {isBanner ? <BannerCarousel items={[item]} preview /> : <OfferTicket item={item} preview />}
              <div className="mt-3 h-12 rounded-2xl bg-white/80" />
              <div className="mt-2 h-12 rounded-2xl bg-white/50" />
            </div>
            <p className="mt-3 text-center text-[12px] leading-5 text-slate-500">
              {isBanner ? t("Shown on the Home screen.", "Home screen par dikhta hai.") : t("Shown on the Home and Credits screens.", "Home aur Credits screen par dikhta hai.")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-5 py-3.5">
          {error && (
            <p role="alert" className="mr-auto text-[13px] font-semibold text-slate-900">
              {error}
            </p>
          )}
          <button type="button" onClick={onClose} disabled={saving} className={adminSecondaryBtnCls}>
            {t("Cancel", "Cancel")}
          </button>
          <button type="button" onClick={onSave} disabled={saving} className={adminPrimaryBtnCls}>
            {saving ? t("Saving…", "Save ho raha hai…") : draft.is_active ? t("Save", "Save karo") : t("Save as paused", "Paused save karo")}
          </button>
        </div>
      </div>
    </div>
  );
}
