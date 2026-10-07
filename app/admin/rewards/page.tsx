"use client";

// ============================================================
// /admin/rewards — Refer & Rewards (tab of the Customers hub).
// ============================================================
// Read-only report of the free credits customers earn:
//   • Refer a friend  → referrer + friend credits (public.referrals)
//   • Rate / feedback → credits per rating (public.feedback)
// Data comes from /api/admin/rewards (needs customers.view).
// Rules and reasons: lib/referral.ts.
//
// Training: lesson "customers" in app/admin/training/lessons.ts.
// ============================================================

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ShieldCheck, Star } from "lucide-react";

import { REWARD_REASONS, REWARD_RULES } from "@/lib/referral";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminInputCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { useAdminLang } from "../i18n";

type T = (en: string, hi: string) => string;

type Person = { id: string; email: string | null; name: string | null; code: string | null };
type Referral = { id: string; at: string; referrer: Person; friend: Person; credits: number; friendBonus: boolean; friendPaid: boolean };
type Unrewarded = { friend: Person; code: string; at: string | null; friendPaid: boolean; why: "creator" | "missed" | "unknown" };
type Feedback = { id: string; at: string; user: Person; rating: number; text: string | null; credits: number; agent: string | null };
type Tx = { at: string; reason: string; credits: number };
type Data = { referrals: Referral[]; unrewarded: Unrewarded[]; feedback: Feedback[]; feedbackLimit: number; tx: Tx[] };

type View = "referrals" | "top" | "feedback" | "unrewarded";

const PERIODS: { days: number; en: string; hi: string }[] = [
  { days: 7, en: "Last 7 days", hi: "Pichhle 7 din" },
  { days: 30, en: "Last 30 days", hi: "Pichhle 30 din" },
  { days: 90, en: "Last 90 days", hi: "Pichhle 90 din" },
  { days: 0, en: "All time", hi: "Shuru se ab tak" },
];

const num = (n: number) => n.toLocaleString("en-IN");
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const label = (p: Person) => p.name?.trim() || p.email || "Unknown user";
const matches = (q: string, ...parts: (string | null | undefined)[]) =>
  !q || parts.some((part) => (part ?? "").toLowerCase().includes(q));

export default function AdminRewardsPage() {
  const { loading: loadingAuth, isAdmin, email, has } = useAdminPermissions();
  const { lang } = useAdminLang();
  const t: T = useCallback((en, hi) => (lang === "hi" ? hi : en), [lang]);
  const canView = has("customers.view");

  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [days, setDays] = useState(30);
  const [view, setView] = useState<View>("referrals");
  const [search, setSearch] = useState("");
  // "Now" is read when data arrives, so the period maths stays pure.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!canView) return;
    let active = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/rewards", {
        headers: { Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as Partial<Data> & { error?: string };
      if (!active) return;
      if (!res.ok) {
        setError(json.error || "Could not load.");
        return;
      }
      setError(null);
      setNow(Date.now());
      setData({
        referrals: json.referrals ?? [],
        unrewarded: json.unrewarded ?? [],
        feedback: json.feedback ?? [],
        feedbackLimit: json.feedbackLimit ?? 300,
        tx: json.tx ?? [],
      });
    })();
    return () => {
      active = false;
    };
  }, [canView, refreshKey]);

  const since = days > 0 ? now - days * 86_400_000 : 0;
  const q = search.trim().toLowerCase();

  const shown = useMemo(() => {
    const inPeriod = (iso: string | null) => !since || (iso ? new Date(iso).getTime() >= since : false);
    const referrals = (data?.referrals ?? []).filter((r) => inPeriod(r.at));
    const unrewarded = (data?.unrewarded ?? []).filter((u) => inPeriod(u.at));
    const feedback = (data?.feedback ?? []).filter((f) => inPeriod(f.at));
    const tx = (data?.tx ?? []).filter((x) => inPeriod(x.at));

    const sum = (reasons: string[]) => tx.filter((x) => reasons.includes(x.reason)).reduce((total, x) => total + x.credits, 0);
    const feedbackTx = tx.filter((x) => x.reason === REWARD_REASONS.feedback);

    // Top referrers in this period.
    const byReferrer = new Map<string, { person: Person; friends: number; paying: number; credits: number }>();
    for (const r of referrals) {
      const row = byReferrer.get(r.referrer.id) ?? { person: r.referrer, friends: 0, paying: 0, credits: 0 };
      row.friends += 1;
      row.paying += r.friendPaid ? 1 : 0;
      row.credits += r.credits;
      byReferrer.set(r.referrer.id, row);
    }
    const top = Array.from(byReferrer.values()).sort((a, b) => b.friends - a.friends || b.paying - a.paying);

    return {
      referrals,
      unrewarded,
      feedback,
      top,
      stats: {
        friends: referrals.length,
        friendsPaid: referrals.filter((r) => r.friendPaid).length,
        referralCredits: sum([REWARD_REASONS.referrer, REWARD_REASONS.friend]),
        feedbackCount: feedbackTx.length,
        feedbackCredits: feedbackTx.reduce((total, x) => total + x.credits, 0),
      },
    };
  }, [data, since]);

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
            {t("Your role needs the customers.view permission. Ask the founder.", "Aapke role ko customers.view permission chahiye. Founder se bolo.")}
          </p>
        </div>
      </main>
    );
  }

  const referrals = shown.referrals.filter((r) => matches(q, r.referrer.name, r.referrer.email, r.referrer.code, r.friend.name, r.friend.email));
  const top = shown.top.filter((r) => matches(q, r.person.name, r.person.email, r.person.code));
  const feedback = shown.feedback.filter((f) => matches(q, f.user.name, f.user.email, f.text, f.agent));
  const unrewarded = shown.unrewarded.filter((u) => matches(q, u.friend.name, u.friend.email, u.code));

  const VIEWS: { key: View; text: string; count: number }[] = [
    { key: "referrals", text: t("Referrals", "Referrals"), count: shown.referrals.length },
    { key: "top", text: t("Top referrers", "Top referrers"), count: shown.top.length },
    { key: "feedback", text: t("Feedback rewards", "Feedback rewards"), count: shown.feedback.length },
    { key: "unrewarded", text: t("Code used, no reward", "Code laga, reward nahi"), count: shown.unrewarded.length },
  ];

  const WHY: Record<Unrewarded["why"], { title: string; text: string }> = {
    creator: {
      title: t("Creator's code", "Creator ka code"),
      text: t("A content creator's code. Their commission is tracked under Influencers; customer credits are given only when the code is linked to a customer account.", "Ye content creator ka code hai. Unka commission Influencers mein track hota hai; customer credits tabhi milte hain jab code customer account se juda ho."),
    },
    missed: {
      title: t("Reward did not run", "Reward nahi chala"),
      text: t("A customer owns this code but the credits were not given. If it is genuine, raise an Approval and add the credits by hand.", "Ye code ek customer ka hai par credits nahi diye gaye. Sahi case ho to Approval daalo aur credits haath se add karo."),
    },
    unknown: {
      title: t("Code not found", "Code nahi mila"),
      text: t("No account owns this code — a typo or an old code. Ask the customer who referred them.", "Ye code kisi account ka nahi hai — typo ya purana code. Customer se poocho kisne refer kiya."),
    },
  };

  const empty = (text: string) => <p className={`p-10 text-center text-sm ${adminMutedCls}`}>{text}</p>;
  const noneInPeriod = t("Nothing in this period. Try a longer period.", "Is period mein kuch nahi hai. Lamba period chuno.");

  return (
    <AdminShell
      breadcrumbs={[{ label: t("Customers", "Customers"), href: "/admin/customers" }, { label: t("Refer & Rewards", "Refer aur Rewards") }]}
      title={t("Refer & Rewards", "Refer aur Rewards")}
      subtitle={t("Who referred whom, and the free credits customers earned", "Kisne kisko refer kiya, aur customers ne kitne free credits kamaye")}
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          {t("Refresh", "Refresh")}
        </button>
      }
    >
      {/* The rules, so nobody has to remember them */}
      <p className={`max-w-3xl text-[13px] leading-6 ${adminMutedCls}`}>
        {t(
          `Rules now: the referrer gets ${REWARD_RULES.referrer} credits and the friend gets ${REWARD_RULES.friend} when the friend signs up with the referral link, or types the code on the app sign-up screen. Rating a completed result gives +${REWARD_RULES.rating} credit, once per result; written feedback gives no extra credit. All of it happens automatically.`,
          `Abhi ke rules: dost referral link se signup kare, ya app ke signup screen par code daale, to refer karne wale ko ${REWARD_RULES.referrer} credits aur dost ko ${REWARD_RULES.friend} milte hain. Complete hue result ko rating dene par +${REWARD_RULES.rating} credit, har result par ek baar; likhe hue feedback par koi extra credit nahi. Ye sab apne aap hota hai.`,
        )}
      </p>

      {/* Period + numbers */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t("Period", "Period")} className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              aria-pressed={days === p.days}
              onClick={() => setDays(p.days)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${
                days === p.days ? "bg-[#020D23] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t(p.en, p.hi)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          title={t("Friends referred", "Refer hue dost")}
          value={data ? num(shown.stats.friends) : "…"}
          sub={t(`${num(shown.stats.friendsPaid)} became paying customers`, `${num(shown.stats.friendsPaid)} paying customer bane`)}
        />
        <Stat
          title={t("Credits given for referrals", "Referral par diye credits")}
          value={data ? num(shown.stats.referralCredits) : "…"}
          sub={t(`${REWARD_RULES.referrer} referrer + ${REWARD_RULES.friend} friend, each`, `Har ek par ${REWARD_RULES.referrer} referrer + ${REWARD_RULES.friend} dost`)}
        />
        <Stat
          title={t("Feedback rewards", "Feedback rewards")}
          value={data ? num(shown.stats.feedbackCount) : "…"}
          sub={t("times a rating was rewarded", "baar rating par reward mila")}
        />
        <Stat
          title={t("Credits given for feedback", "Feedback par diye credits")}
          value={data ? num(shown.stats.feedbackCredits) : "…"}
          sub={t(`+${REWARD_RULES.rating} per rated result`, `Har rated result par +${REWARD_RULES.rating}`)}
        />
      </div>

      {/* Which list + search */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t("List", "List")} className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setView(v.key)}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${
                view === v.key ? "bg-[#020D23] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {v.text}
              <span className={`ml-1.5 text-xs font-medium tabular-nums ${view === v.key ? "text-white/70" : "text-slate-400"}`}>{num(v.count)}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search name, email or code", "Naam, email ya code search karo")}
            className={`${adminInputCls} pl-9`}
          />
        </div>
      </div>

      <div className={`${adminCardCls} mt-3 overflow-hidden`}>
        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-800">{t("Could not load rewards", "Rewards load nahi hue")}</p>
            <p className={`mx-auto mt-1 max-w-md text-[13px] leading-6 ${adminMutedCls}`}>{error}</p>
          </div>
        ) : !data ? (
          empty(t("Loading…", "Load ho raha hai…"))
        ) : view === "referrals" ? (
          referrals.length === 0 ? (
            empty(shown.referrals.length === 0 ? (data.referrals.length === 0 ? t("No referrals yet. They show here the moment a friend signs up with a code.", "Abhi koi referral nahi hai. Dost code se signup karte hi yahan dikhega.") : noneInPeriod) : t("No referral matches your search.", "Search se koi referral nahi mila."))
          ) : (
            <ul className="divide-y divide-slate-200">
              {referrals.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <PersonLink p={r.referrer} />
                      <span className={`text-[12px] ${adminMutedCls}`}>{t("referred", "ne refer kiya")}</span>
                      <PersonLink p={r.friend} />
                    </p>
                    <p className={`mt-0.5 truncate text-[12px] ${adminMutedCls}`}>
                      {day(r.at)} · {t("code", "code")} <span className="font-mono text-slate-700">{r.referrer.code ?? "—"}</span> · {r.friend.email ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Chip tone="good">{t(`Referrer +${r.credits}`, `Referrer +${r.credits}`)}</Chip>
                    {r.friendBonus ? (
                      <Chip tone="good">{t(`Friend +${REWARD_RULES.friend}`, `Dost +${REWARD_RULES.friend}`)}</Chip>
                    ) : (
                      <Chip tone="quiet">{t("Friend bonus not found", "Dost ka bonus nahi mila")}</Chip>
                    )}
                    {r.friendPaid && <Chip tone="strong">{t("Friend is a paying customer", "Dost paying customer hai")}</Chip>}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : view === "top" ? (
          top.length === 0 ? (
            empty(shown.top.length === 0 ? noneInPeriod : t("No referrer matches your search.", "Search se koi referrer nahi mila."))
          ) : (
            <ul className="divide-y divide-slate-200">
              {top.map((row, i) => (
                <li key={row.person.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-bold tabular-nums text-slate-700">{i + 1}</span>
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="text-sm">
                      <PersonLink p={row.person} />
                    </p>
                    <p className={`mt-0.5 truncate text-[12px] ${adminMutedCls}`}>
                      {row.person.email ?? "—"} · {t("code", "code")} <span className="font-mono text-slate-700">{row.person.code ?? "—"}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-5 text-right">
                    <Figure value={num(row.friends)} text={t("friends", "dost")} />
                    <Figure value={num(row.paying)} text={t("paying", "paying")} />
                    <Figure value={num(row.credits)} text={t("credits earned", "credits kamaye")} />
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : view === "feedback" ? (
          feedback.length === 0 ? (
            empty(shown.feedback.length === 0 ? noneInPeriod : t("No feedback matches your search.", "Search se koi feedback nahi mila."))
          ) : (
            <>
              <ul className="divide-y divide-slate-200">
                {feedback.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3.5">
                    <div className="min-w-0 flex-1 basis-64">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <PersonLink p={f.user} />
                        <span className="inline-flex items-center gap-0.5 text-[13px] font-bold tabular-nums text-slate-700" aria-label={`${f.rating} / 5`}>
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {f.rating}
                        </span>
                      </p>
                      {f.text && <p className="mt-1 text-[13px] leading-5 text-slate-700">“{f.text}”</p>}
                      <p className={`mt-0.5 truncate text-[12px] ${adminMutedCls}`}>
                        {day(f.at)}
                        {f.agent ? ` · ${f.agent}` : ""} · {f.user.email ?? "—"}
                      </p>
                    </div>
                    {f.credits > 0 ? (
                      <Chip tone="good">{t(`+${f.credits} credits`, `+${f.credits} credits`)}</Chip>
                    ) : (
                      <Chip tone="quiet">{t("No credits (team generation)", "Credits nahi (team generation)")}</Chip>
                    )}
                  </li>
                ))}
              </ul>
              {data.feedback.length >= data.feedbackLimit && (
                <p className={`border-t border-slate-200 px-4 py-3 text-center text-[12px] ${adminMutedCls}`}>
                  {t(`Showing the latest ${data.feedbackLimit} feedback entries. The numbers on top count all of them.`, `Sabse naye ${data.feedbackLimit} feedback dikh rahe hain. Upar ke numbers mein sab gine gaye hain.`)}
                </p>
              )}
            </>
          )
        ) : unrewarded.length === 0 ? (
          empty(shown.unrewarded.length === 0 ? t("Every sign-up with a code in this period got its reward.", "Is period mein code wale har signup ko reward mila.") : t("Nothing matches your search.", "Search se kuch nahi mila."))
        ) : (
          <ul className="divide-y divide-slate-200">
            {unrewarded.map((u) => (
              <li key={u.friend.id} className="px-4 py-3.5">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <PersonLink p={u.friend} />
                  <span className={`text-[12px] ${adminMutedCls}`}>{t("signed up with code", "ne is code se signup kiya")}</span>
                  <span className="font-mono text-[13px] font-semibold text-slate-800">{u.code}</span>
                  <Chip tone="quiet">{WHY[u.why].title}</Chip>
                  {u.friendPaid && <Chip tone="strong">{t("Paying customer", "Paying customer")}</Chip>}
                </p>
                <p className={`mt-1 max-w-3xl text-[12px] leading-5 ${adminMutedCls}`}>
                  {day(u.at)} · {u.friend.email ?? "—"} · {WHY[u.why].text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className={`${adminCardCls} p-4`}>
      <p className="text-[12px] font-semibold text-slate-500">{title}</p>
      <p className="mt-1.5 text-3xl font-bold leading-none tabular-nums text-slate-900">{value}</p>
      <p className="mt-2 text-[12px] leading-4 text-slate-500">{sub}</p>
    </div>
  );
}

function Figure({ value, text }: { value: string; text: string }) {
  return (
    <div>
      <p className="text-base font-bold leading-tight tabular-nums text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{text}</p>
    </div>
  );
}

function Chip({ tone, children }: { tone: "good" | "strong" | "quiet"; children: React.ReactNode }) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "strong"
        ? "bg-violet-50 text-violet-700 ring-violet-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  return <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ring-1 ring-inset ${cls}`}>{children}</span>;
}

/** A customer's name, linking to their page. */
function PersonLink({ p }: { p: Person }) {
  return (
    <Link href={`/admin/customers/${p.id}`} className="font-bold text-slate-900 underline-offset-2 hover:underline focus:outline-none focus-visible:underline">
      {label(p)}
    </Link>
  );
}
