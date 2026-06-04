"use client";

// /admin/whatsapp — WhatsApp Inbox. Live conversations from the
// Business Cloud API webhook. Review AI drafts and send replies.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Send, Sparkles, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Msg = {
  id: string;
  wa_from: string;
  wa_name: string | null;
  direction: "in" | "out";
  body: string;
  ai_reply: string | null;
  reply_sent: boolean;
  created_at: string;
};

type Thread = { wa_from: string; wa_name: string | null; last_body: string; last_at: string };

export default function WhatsAppInboxPage() {
  const { loading: pLoading, has, isAdmin, email } = useAdminPermissions();
  const canView   = has("support.view") || isAdmin;
  const canManage = has("support.manage") || isAdmin;

  const [threads, setThreads]   = useState<Thread[]>([]);
  const [active, setActive]     = useState<string | null>(null);
  const [msgs, setMsgs]         = useState<Msg[]>([]);
  const [draft, setDraft]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load threads
  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("wa_from, wa_name, body, direction, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      // Dedupe to latest per number
      const seen = new Set<string>();
      const list: Thread[] = [];
      for (const m of (data as any[]) ?? []) {
        if (seen.has(m.wa_from)) continue;
        seen.add(m.wa_from);
        list.push({ wa_from: m.wa_from, wa_name: m.wa_name, last_body: m.body, last_at: m.created_at });
      }
      setThreads(list);
      if (!active && list.length) setActive(list[0].wa_from);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  // Load messages for active thread
  useEffect(() => {
    if (!active) return;
    (async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("wa_from", active)
        .order("created_at", { ascending: true });
      const list = (data as Msg[]) ?? [];
      setMsgs(list);
      // Prefill draft with latest AI reply if not yet sent
      const lastIn = [...list].reverse().find((m) => m.direction === "in");
      setDraft(lastIn?.ai_reply && !lastIn.reply_sent ? lastIn.ai_reply : "");
    })();
  }, [active, refreshKey]);

  async function send() {
    if (!active || !draft.trim()) return;
    setSending(true);
    const { data: sess } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/ai/whatsapp-send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ to: active, body: draft }),
    });
    const json = await res.json();
    setSending(false);
    if (json.ok) { setDraft(""); setRefreshKey((k) => k + 1); }
    else alert(json.error ?? "Send failed");
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "WhatsApp" }]}
      title="WhatsApp Inbox"
      subtitle="Live customer chats — review AI drafts and reply"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </button>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : threads.length === 0 ? (
        <div className={`${adminCardCls} p-12 text-center`}>
          <MessageCircle className="mx-auto h-8 w-8 text-slate-300" />
          <p className={`mt-2 text-sm ${adminMutedCls}`}>Abhi koi WhatsApp message nahi aaya.</p>
          <p className={`mt-1 text-[11px] ${adminMutedCls}`}>Webhook connect hone ke baad customer messages yahan aayenge.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Thread list */}
          <div className={`${adminCardCls} overflow-hidden lg:col-span-1`}>
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Conversations</p>
            </div>
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {threads.map((t) => (
                <li key={t.wa_from}>
                  <button type="button" onClick={() => setActive(t.wa_from)}
                    className={`w-full px-4 py-3 text-left transition ${active === t.wa_from ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}>
                    <p className="text-xs font-bold">{t.wa_name ?? t.wa_from}</p>
                    <p className={`truncate text-[11px] ${adminMutedCls}`}>{t.last_body}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat */}
          <div className={`${adminCardCls} flex flex-col lg:col-span-2`} style={{ minHeight: "60vh" }}>
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-bold">{threads.find((t) => t.wa_from === active)?.wa_name ?? active}</p>
              <p className={`text-[11px] ${adminMutedCls}`}>{active}</p>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: "45vh" }}>
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.direction === "out" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"}`}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`mt-0.5 text-[10px] ${m.direction === "out" ? "text-white/70" : adminMutedCls}`}>
                      {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {m.direction === "out" && (m.reply_sent ? " ✓" : " (failed)")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            {canManage && (
              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                {msgs.some((m) => m.ai_reply && m.direction === "in") && (
                  <p className={`mb-1.5 flex items-center gap-1 text-[10px] font-bold ${adminMutedCls}`}>
                    <Sparkles className="h-3 w-3 text-indigo-500" />AI draft prefilled — edit and send
                  </p>
                )}
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    rows={2}
                    placeholder="Type a reply…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button type="button" onClick={send} disabled={sending || !draft.trim()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                    <Send className="h-4 w-4" />{sending ? "…" : "Send"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
