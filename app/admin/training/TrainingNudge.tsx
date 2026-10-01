"use client";

// Home-page card: shows the member's training progress and a
// "Continue" button until every lesson for their role is done.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdminPermissions } from "../AdminPermissions";
import { useAdminLang } from "../i18n";
import { useVisibleHubs } from "../Sidebar";
import { allLessons } from "./lessons";

export default function TrainingNudge() {
  const { email } = useAdminPermissions();
  const { lang } = useAdminLang();
  const hubs = useVisibleHubs();
  const [done, setDone] = useState<Set<string> | null>(null);

  const mine = useMemo(() => {
    const keys = new Set(hubs.map((x) => x.hub.key));
    return allLessons().filter((l) => l.hub === null || keys.has(l.hub));
  }, [hubs]);

  useEffect(() => {
    if (!email) return;
    supabase
      .from("admin_training_progress")
      .select("lesson_key")
      .eq("email", email)
      .then(({ data }) => setDone(new Set(((data as { lesson_key: string }[] | null) ?? []).map((r) => r.lesson_key))));
  }, [email]);

  if (!done || mine.length === 0) return null;
  const count = mine.filter((l) => done.has(l.key)).length;
  if (count >= mine.length) return null;
  const pct = Math.round((count / mine.length) * 100);
  const started = count > 0;

  return (
    <Link
      href="/admin/training"
      className="group flex flex-col gap-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-orange-50 p-5 transition hover:border-violet-300 sm:flex-row sm:items-center"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
        <GraduationCap className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-[#020D23]">
          {lang === "hi"
            ? started ? "Apni backend training poori karo" : "Pehle backend training kar lo"
            : started ? "Finish your backend training" : "Start your backend training"}
        </span>
        <span className="mt-0.5 block text-[13px] text-slate-500">
          {lang === "hi"
            ? `${count}/${mine.length} lessons complete · aapke role ke hisaab se, ~${mine.reduce((n, l) => n + l.minutes, 0)} min`
            : `${count}/${mine.length} lessons done · made for your role, ~${mine.reduce((n, l) => n + l.minutes, 0)} min`}
        </span>
        <span className="mt-2.5 block h-1.5 max-w-sm overflow-hidden rounded-full bg-white">
          <span className="block h-full rounded-full bg-gradient-to-r from-[#3C68FA] via-[#9B58FC] to-[#FD6D08]" style={{ width: `${Math.max(pct, 3)}%` }} />
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-[#020D23] px-4 py-2 text-sm font-semibold text-white sm:self-center">
        {lang === "hi" ? (started ? "Continue karo" : "Shuru karo") : started ? "Continue" : "Start"}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
