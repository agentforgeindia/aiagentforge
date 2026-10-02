"use client";

// /ai-social-publisher/accounts — Connected Accounts (PREVIEW)
// No OAuth yet. Sample rows show how a real connection will look.

import React from "react";
import { ShieldCheck, RefreshCw, Unplug, Plug, CheckCircle2, AlertCircle } from "lucide-react";
import { PLATFORM_LIST, PLATFORM_NAME } from "../_components/data";
import { useStyles, usePublisherStore, PlatformIcon, AccountAvatar } from "../_components/ui";

export default function AccountsPage() {
  const { card, muted, ghostBtn, primaryBtn, line } = useStyles();
  const { accounts } = usePublisherStore();

  return (
    <section className={`rounded-3xl border p-3 shadow-xl shadow-cyan-900/5 backdrop-blur-xl sm:p-5 ${card}`}>
      <div className="flex items-start gap-2.5 rounded-2xl bg-blue-500/[0.07] p-3.5 text-xs font-semibold text-blue-800 dark:text-blue-200 sm:text-sm">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <p>Account official login se connect hota hai. Aapka password AgentForge ko kabhi nahi dikhta. Disconnect karte hi access hat jaata hai.</p>
      </div>

      <div className={`mt-4 divide-y ${line} divide-black/[0.06] dark:divide-white/10`}>
        {PLATFORM_LIST.map((p) => {
          const accs = accounts.filter((a) => a.platform === p.id);
          return (
            <div key={p.id} className="py-4">
              <div className="flex items-center gap-3">
                <PlatformIcon id={p.id} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black">{PLATFORM_NAME[p.id]}</p>
                  <p className={`text-xs ${muted}`}>{p.note}</p>
                </div>
                {p.available ? (
                  <button type="button" disabled title="Phase 2 me Meta login se connect hoga" className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black ${primaryBtn}`}>
                    <Plug className="h-4 w-4" /> Connect
                  </button>
                ) : (
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${ghostBtn}`}>Coming soon</span>
                )}
              </div>

              {accs.length > 0 && (
                <div className="mt-3 space-y-2 sm:pl-14">
                  {accs.map((a) => {
                    const broken = a.status === "needs_reauth";
                    return (
                      <div key={a.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-2.5 ${line}`}>
                        <AccountAvatar account={a} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{a.name}</p>
                          <p className={`text-[11px] ${muted}`}>{a.type} · sample</p>
                        </div>
                        {broken ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-600">
                            <AlertCircle className="h-4 w-4" /> Login expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Connected
                          </span>
                        )}
                        <div className="flex w-full gap-2 sm:w-auto">
                          {broken && (
                            <button type="button" className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black sm:flex-none ${primaryBtn}`}>
                              <RefreshCw className="h-3.5 w-3.5" /> Reconnect
                            </button>
                          )}
                          <button type="button" className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold sm:flex-none ${ghostBtn}`}>
                            <Unplug className="h-3.5 w-3.5" /> Disconnect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
