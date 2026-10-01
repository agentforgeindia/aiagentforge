"use client";

// ============================================================
// /admin/training — self-paced backend training, role-wise.
// ============================================================
// Every member sees "Backend basics" + one lesson for each module
// hub their role can open. Lesson = intro, steps, "open the page"
// buttons and a short quiz. All answers right → lesson complete
// (saved in admin_training_progress). Founder also gets a Team
// progress view (who finished how much).
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, CheckCircle2, Circle, Clock, ExternalLink, GraduationCap, RotateCcw, Users, XCircle } from "lucide-react";
import AdminShell from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { HUBS, hubByKey, tabLabel, visibleTabs } from "../adminHubs";
import { useAdminLang } from "../i18n";
import { useVisibleHubs } from "../Sidebar";
import { supabase } from "@/lib/supabase";
import { allLessons, hubsMissingLesson, type Lesson } from "./lessons";

type Progress = { lesson_key: string; score: number; total: number; completed_at: string };

const S = {
  title:      { en: "Backend Training", hi: "Backend Training" },
  subtitle:   { en: "Learn the admin panel at your own pace — lessons are picked for your role.", hi: "Apni speed se admin panel seekho — lessons aapke role ke hisaab se hain." },
  myCourse:   { en: "My course", hi: "Mera course" },
  team:       { en: "Team progress", hi: "Team progress" },
  done:       { en: "lessons completed", hi: "lessons complete" },
  allDone:    { en: "🎉 All done! You have completed your training.", hi: "🎉 Shabaash! Aapki training poori ho gayi." },
  min:        { en: "min", hi: "min" },
  steps:      { en: "How to use it", hi: "Kaise use karein" },
  tips:       { en: "Tip", hi: "Tip" },
  open:       { en: "Try it now — open the page", hi: "Abhi try karo — page kholo" },
  quiz:       { en: "Quick check", hi: "Chhota quiz" },
  quizNote:   { en: "Answer all questions correctly to complete this lesson.", hi: "Saare sawal sahi karo to lesson complete hoga." },
  submit:     { en: "Check answers", hi: "Answer check karo" },
  retry:      { en: "Try again", hi: "Dobara try karo" },
  next:       { en: "Next lesson", hi: "Agla lesson" },
  passed:     { en: "Correct! Lesson completed.", hi: "Sahi! Lesson complete." },
  failed:     { en: "Some answers are wrong — read the explanation and try again.", hi: "Kuch answer galat hain — explanation padho aur dobara try karo." },
  completed:  { en: "Completed", hi: "Complete" },
  member:     { en: "Member", hi: "Member" },
  role:       { en: "Role", hi: "Role" },
  progress:   { en: "Progress", hi: "Progress" },
  last:       { en: "Last lesson done", hi: "Aakhri lesson" },
  never:      { en: "Not started", hi: "Shuru nahi kiya" },
  saveErr:    { en: "Could not save progress", hi: "Progress save nahi hua" },
  missing:    { en: "Needs a written lesson:", hi: "Inka proper lesson likhna baaki hai:" },
  missingNote:{ en: "These new modules currently use an automatic basic lesson. Add a full lesson in app/admin/training/lessons.ts.", hi: "In naye modules ka abhi automatic basic lesson chal raha hai. app/admin/training/lessons.ts mein poora lesson jodo." },
};

function permMatch(perm: string, owned: string[]) {
  if (perm === "any") return true;
  if (owned.includes("*") || owned.includes(perm)) return true;
  return owned.includes(perm.split(".")[0] + ".*");
}

export default function TrainingPage() {
  const { loading, email, isFounder, availableRoles } = useAdminPermissions();
  const { tl, lang } = useAdminLang();
  const hubs = useVisibleHubs();
  const [view, setView] = useState<"me" | "team">("me");
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const myLessons = useMemo(() => {
    const keys = new Set(hubs.map((x) => x.hub.key));
    return allLessons().filter((ls) => ls.hub === null || keys.has(ls.hub));
  }, [hubs]);

  useEffect(() => {
    if (!email) return;
    (async () => {
      const { data } = await supabase
        .from("admin_training_progress")
        .select("lesson_key, score, total, completed_at")
        .eq("email", email);
      const map: Record<string, Progress> = {};
      ((data as Progress[] | null) ?? []).forEach((p) => (map[p.lesson_key] = p));
      setProgress(map);
    })();
  }, [email]);

  const doneCount = myLessons.filter((ls) => progress[ls.key]).length;
  const pct = myLessons.length ? Math.round((doneCount / myLessons.length) * 100) : 0;
  const current =
    myLessons.find((ls) => ls.key === activeKey) ??
    myLessons.find((ls) => !progress[ls.key]) ??
    myLessons[0];

  if (loading) return null;

  return (
    <AdminShell breadcrumbs={[{ label: tl(S.title) }]} title={tl(S.title)} subtitle={tl(S.subtitle)} email={email}>
      {isFounder && (
        <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {(["me", "team"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition ${
                view === v ? "bg-[#020D23] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {v === "me" ? <GraduationCap className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {tl(v === "me" ? S.myCourse : S.team)}
            </button>
          ))}
        </div>
      )}

      {view === "team" && isFounder ? (
        <div className="space-y-4">
          {hubsMissingLesson().length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              <b>{tl(S.missing)}</b>{" "}
              {hubsMissingLesson().map((h) => tl(h.label)).join(", ")}
              <span className="block text-amber-800/80">{tl(S.missingNote)}</span>
            </div>
          )}
          <TeamProgress roles={availableRoles} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-sm text-slate-600">
                <span className="text-2xl font-semibold text-[#020D23]">{doneCount}</span>
                <span className="text-slate-400"> / {myLessons.length}</span> {tl(S.done)}
              </p>
              <p className="text-sm font-semibold text-violet-700">{pct}%</p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-[#3C68FA] via-[#9B58FC] to-[#FD6D08] transition-all" style={{ width: `${pct}%` }} />
            </div>
            {doneCount === myLessons.length && myLessons.length > 0 && (
              <p className="mt-3 text-sm font-medium text-emerald-700">{tl(S.allDone)}</p>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[300px_1fr] lg:gap-6">
            {/* Lesson picker — dropdown on phones, list on desktop */}
            <label className="block lg:hidden">
              <select
                value={current?.key ?? ""}
                onChange={(e) => setActiveKey(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
              >
                {myLessons.map((ls, idx) => (
                  <option key={ls.key} value={ls.key}>
                    {progress[ls.key] ? "✓ " : `${idx + 1}. `}
                    {tl(ls.title)} · {ls.minutes} {tl(S.min)}
                  </option>
                ))}
              </select>
            </label>
            <ol className="hidden space-y-1 self-start rounded-2xl border border-slate-200/80 bg-white p-2 lg:sticky lg:top-24 lg:block">
              {myLessons.map((ls, idx) => {
                const done = !!progress[ls.key];
                const active = current?.key === ls.key;
                return (
                  <li key={ls.key}>
                    <button
                      type="button"
                      onClick={() => setActiveKey(ls.key)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        active ? "bg-violet-50" : "hover:bg-slate-50"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                      ) : (
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${active ? "border-violet-400 text-violet-700" : "border-slate-300 text-slate-400"}`}>
                          {idx + 1}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[13px] ${active ? "font-semibold text-violet-800" : "font-medium text-slate-700"}`}>{tl(ls.title)}</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" /> {ls.minutes} {tl(S.min)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {current && (
              <LessonView
                key={current.key + lang}
                lesson={current}
                done={!!progress[current.key]}
                email={email ?? ""}
                onPassed={(p) => setProgress((prev) => ({ ...prev, [current.key]: p }))}
                onNext={() => {
                  const i = myLessons.findIndex((x) => x.key === current.key);
                  const next = myLessons.slice(i + 1).find((x) => !progress[x.key]) ?? myLessons[i + 1];
                  if (next) setActiveKey(next.key);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function LessonView({
  lesson,
  done,
  email,
  onPassed,
  onNext,
}: {
  lesson: Lesson;
  done: boolean;
  email: string;
  onPassed: (p: Progress) => void;
  onNext: () => void;
}) {
  const { tl, lang } = useAdminLang();
  const { has } = useAdminPermissions();
  const [answers, setAnswers] = useState<(number | null)[]>(lesson.quiz.map(() => null));
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const hub = lesson.hub ? hubByKey(lesson.hub) : null;
  const pages = hub ? visibleTabs(hub, has) : [];
  const score = lesson.quiz.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const allRight = checked && score === lesson.quiz.length;

  async function check() {
    setChecked(true);
    if (lesson.quiz.every((q, i) => answers[i] === q.correct)) {
      setSaving(true);
      const row = { email, lesson_key: lesson.key, score: lesson.quiz.length, total: lesson.quiz.length, completed_at: new Date().toISOString() };
      const { error } = await supabase.from("admin_training_progress").upsert(row, { onConflict: "email,lesson_key" });
      setSaving(false);
      if (error) {
        alert(`${tl(S.saveErr)}: ${error.message}`);
        return;
      }
      onPassed(row);
    }
  }

  return (
    <article className="min-w-0 space-y-4 sm:space-y-6">
      <header className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">
            <BookOpenCheck className="h-3.5 w-3.5" /> {lesson.minutes} {tl(S.min)}
          </span>
          {done && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> {tl(S.completed)}
            </span>
          )}
        </div>
        <h2 className="mt-3 text-xl font-semibold text-[#020D23]">{tl(lesson.title)}</h2>
        <p className="mt-1.5 text-[15px] leading-7 text-slate-600">{tl(lesson.intro)}</p>
      </header>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{tl(S.steps)}</h3>
        <ol className="mt-4 space-y-4">
          {lesson.steps.map((s, i) => (
            <li key={i} className="flex gap-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#020D23] text-xs font-semibold text-white">{i + 1}</span>
              <p className="pt-0.5 text-[14.5px] leading-7 text-slate-700">{tl(s)}</p>
            </li>
          ))}
        </ol>
        {lesson.tips?.map((t, i) => (
          <p key={i} className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
            💡 <b>{tl(S.tips)}:</b> {tl(t)}
          </p>
        ))}
        {pages.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-[13px] font-medium text-slate-500">{tl(S.open)}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {pages.map((h) => (
                <Link
                  key={h}
                  href={h}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
                >
                  {tabLabel(h, lang)} <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{tl(S.quiz)}</h3>
        <p className="mt-1 text-[13px] text-slate-500">{tl(S.quizNote)}</p>
        <div className="mt-5 space-y-6">
          {lesson.quiz.map((q, qi) => (
            <fieldset key={qi}>
              <legend className="text-[14.5px] font-medium text-[#020D23]">
                {qi + 1}. {tl(q.q)}
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => {
                  const picked = answers[qi] === oi;
                  const right = checked && oi === q.correct;
                  const wrong = checked && picked && oi !== q.correct;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={checked}
                      onClick={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13.5px] transition ${
                        right
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : wrong
                            ? "border-rose-300 bg-rose-50 text-rose-900"
                            : picked
                              ? "border-violet-400 bg-violet-50 text-violet-900"
                              : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {right ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : wrong ? (
                        <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      ) : (
                        <Circle className={`h-4 w-4 shrink-0 ${picked ? "fill-violet-500 text-violet-500" : "text-slate-300"}`} />
                      )}
                      <span className="font-semibold text-slate-400">{String.fromCharCode(65 + oi)}.</span>
                      {tl(o)}
                    </button>
                  );
                })}
              </div>
              {checked && <p className="mt-2 text-[13px] text-slate-500">→ {tl(q.why)}</p>}
            </fieldset>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          {!checked ? (
            <button
              type="button"
              disabled={answers.some((a) => a === null)}
              onClick={check}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6D3FE8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5B2FD6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {tl(S.submit)}
            </button>
          ) : allRight ? (
            <>
              <p className="text-sm font-medium text-emerald-700">{saving ? "…" : tl(S.passed)}</p>
              <button
                type="button"
                onClick={onNext}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#020D23] px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {tl(S.next)} <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-rose-700">{tl(S.failed)}</p>
              <button
                type="button"
                onClick={() => {
                  setAnswers(lesson.quiz.map(() => null));
                  setChecked(false);
                }}
                className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" /> {tl(S.retry)}
              </button>
            </>
          )}
        </div>
      </section>
    </article>
  );
}

type Member = { email: string; role: string | null; active: boolean | null; full_name: string | null };
type TeamRow = { email: string; lesson_key: string; completed_at: string };

function TeamProgress({ roles }: { roles: { id: string; label: string; permissions: string[] }[] }) {
  const { tl } = useAdminLang();
  const [members, setMembers] = useState<Member[]>([]);
  const [rows, setRows] = useState<TeamRow[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from("admin_users").select("email, role, active, full_name").order("created_at", { ascending: true }),
        supabase.rpc("training_team_progress"),
      ]);
      setMembers(((m as Member[] | null) ?? []).filter((x) => x.active !== false));
      setRows((p as TeamRow[] | null) ?? []);
    })();
  }, []);

  const required = (roleId: string | null) => {
    const perms = roles.find((r) => r.id === roleId)?.permissions ?? [];
    const hubKeys = new Set(
      HUBS.filter((h) => visibleTabs(h, (p) => permMatch(p, perms)).length > 0).map((h) => h.key),
    );
    return allLessons().filter((ls) => ls.hub === null || hubKeys.has(ls.hub)).map((ls) => ls.key);
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">{tl(S.member)}</th>
            <th className="px-4 py-3 font-semibold">{tl(S.role)}</th>
            <th className="w-[40%] px-4 py-3 font-semibold">{tl(S.progress)}</th>
            <th className="px-4 py-3 font-semibold">{tl(S.last)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((m) => {
            const req = required(m.role);
            const mine = rows.filter((r) => r.email.toLowerCase() === m.email.toLowerCase());
            const done = req.filter((k) => mine.some((r) => r.lesson_key === k)).length;
            const pct = req.length ? Math.round((done / req.length) * 100) : 0;
            const last = mine[0]?.completed_at;
            return (
              <tr key={m.email}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{m.full_name || m.email.split("@")[0]}</p>
                  <p className="text-[11px] text-slate-400">{m.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">{roles.find((r) => r.id === m.role)?.label ?? m.role ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-16 text-right tabular-nums text-slate-600">
                      {done}/{req.length}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {last ? new Date(last).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : <span className="text-slate-400">{tl(S.never)}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
