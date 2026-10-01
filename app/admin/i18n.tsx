"use client";

// ============================================================
// Admin language — English / Hinglish.
// Choice is saved per browser (localStorage) and applies to the
// admin shell: sidebar, top bar, home, tabs, check-in screen.
// ============================================================

import { useCallback } from "react";
import { useLangPref, type AdminLang } from "./navPrefs";
import type { L } from "./adminHubs";

const DICT = {
  findModule:      { en: "Find a module…", hi: "Module dhoondo…" },
  noMatch:         { en: "No module matches", hi: "Koi module nahi mila" },
  pinned:          { en: "Pinned", hi: "Pinned" },
  pinTip:          { en: "Hover any module and tap the ☆ to pin it here and in the sidebar.", hi: "Kisi bhi module par ☆ dabao — wo yahan aur sidebar mein upar aa jayega." },
  recent:          { en: "Recently opened", hi: "Haal hi mein khole" },
  recentEmpty:     { en: "Modules you open will show up here.", hi: "Jo module khologe wo yahan dikhenge." },
  collapse:        { en: "Collapse", hi: "Chhota karo" },
  searchAnything:  { en: "Search anything…", hi: "Kuch bhi search karo…" },
  newLead:         { en: "New lead", hi: "Naya lead" },
  myProfile:       { en: "My profile", hi: "Meri profile" },
  signOut:         { en: "Sign out", hi: "Sign out" },
  signingOut:      { en: "Signing out…", hi: "Sign out ho raha hai…" },
  back:            { en: "Back", hi: "Peeche" },
  all:             { en: "All", hi: "Sab" },
  homeSearch:      { en: "What do you want to open? Try “leads”, “invoices”, “attendance”…", hi: "Kya kholna hai? Likho “leads”, “invoice”, “attendance”…" },
  modulesFor:      { en: "modules available for your role", hi: "modules aapke role ke liye" },
  noAccess:        { en: "Your role does not grant access to any module yet. Contact the founder.", hi: "Aapke role ko abhi koi module nahi mila hai. Founder se baat karo." },
  archived:        { en: "Archived modules", hi: "Archived modules" },
  archivedNote:    { en: "Hidden from the sidebar. Links still work.", hi: "Sidebar se hata diye. Link ab bhi chalte hain." },
  morning:         { en: "Good morning", hi: "Good morning" },
  afternoon:       { en: "Good afternoon", hi: "Good afternoon" },
  evening:         { en: "Good evening", hi: "Good evening" },
  // check-in gate
  gateTitle:       { en: "Check in to start work", hi: "Kaam shuru karne se pehle Check in karo" },
  gateText:        { en: "The admin panel unlocks after you check in. Your work time is counted from now.", hi: "Check in karte hi admin panel khul jayega. Aapka work time abhi se count hoga." },
  gateIdleTitle:   { en: "You were checked out for inactivity", hi: "10+ min koi activity nahi — aap auto check-out ho gaye" },
  gateIdleText:    { en: "Check in again to continue. You'll be asked for a short reason.", hi: "Aage kaam karne ke liye dobara Check in karo. Chhota sa reason poocha jayega." },
  gateBreakTitle:  { en: "You are on a break", hi: "Aap break par ho" },
  gateBreakText:   { en: "End the break to continue working.", hi: "Kaam continue karne ke liye break khatam karo." },
  checkIn:         { en: "Check in now", hi: "Abhi Check in karo" },
  endBreak:        { en: "End break", hi: "Break khatam karo" },
  todayPlan:       { en: "What will you work on today? (optional)", hi: "Aaj kya kaam karoge? (optional)" },
  checkingStatus:  { en: "Checking attendance…", hi: "Attendance check ho rahi hai…" },
} satisfies Record<string, L>;

export type DictKey = keyof typeof DICT;

export function useAdminLang() {
  const [lang, setLang] = useLangPref();
  const t = useCallback((k: DictKey) => DICT[k][lang], [lang]);
  const tl = useCallback((l: L) => l[lang], [lang]);
  return { lang, setLang, t, tl };
}

export function LangToggle() {
  const { lang, setLang } = useAdminLang();
  const opt = (v: AdminLang, label: string) => (
    <button
      type="button"
      onClick={() => setLang(v)}
      aria-pressed={lang === v}
      className={`rounded-lg px-2 py-1 text-[12px] font-semibold transition ${
        lang === v ? "bg-[#020D23] text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex h-9 items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1" title="Language / Bhasha">
      {opt("en", "EN")}
      {opt("hi", "Hinglish")}
    </div>
  );
}
