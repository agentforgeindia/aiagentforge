"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Sparkles, MessageCircle, CreditCard } from "lucide-react";
import { usePathname } from "next/navigation";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

type Action = {
  label: string;
  type: "link" | "payment";
  url?: string;
  planId?: string;
};

type RecommendedPlan = {
  id: string;
  name: string;
  price: string;
  reason: string;
  cta?: string;
};

type BotResponse = {
  message: string;
  recommendedPlan?: RecommendedPlan | null;
  actions?: Action[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  recommendedPlan?: RecommendedPlan | null;
  actions?: Action[];
};

export default function AgentForgeAI() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I’m AgentForge AI. Tell me your business type and requirement — I’ll help you choose the right AI tool or package.",
    },
  ]);

  const suggestions = [
    "Which plan is best for me?",
    "I have a textile business",
    "How does Textile AI work?",
    "I need bulk generation",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const finalMessage = (text || input).trim();
    if (!finalMessage || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: finalMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agentforge-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: finalMessage, page: pathname, history: messages, }),
      });

      const data: BotResponse = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message || "I’m here to help you with AgentForge.",
          recommendedPlan: data.recommendedPlan || null,
          actions: data.actions || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I’m having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleAction(action: Action) {
    if (action.type === "link" && action.url) {
      window.location.href = action.url;
      return;
    }

    if (action.type === "payment" && action.planId) {
      window.location.href = `/pricing?plan=${action.planId}`;
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 text-sm font-bold text-white shadow-2xl shadow-cyan-500/30 transition hover:scale-105"
        >
          <Sparkles className="h-5 w-5" />
          Ask AgentForge AI
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-[410px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black">AgentForge AI</h3>
                <p className="text-xs text-cyan-50">Sales & Support Assistant</p>
              </div>
            </div>

            <button onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[440px] space-y-4 overflow-y-auto p-4">
            {messages.map((msg, index) => (
              <div key={index} className={msg.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  }`}
                >
                  {msg.content}
                </div>

                {msg.recommendedPlan && (
                  <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-left dark:border-cyan-900 dark:bg-cyan-950/40">
                    <p className="text-xs font-bold uppercase text-cyan-700 dark:text-cyan-300">
                      Recommended Plan
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                      {msg.recommendedPlan.name}
                    </h4>
                    <p className="mt-1 text-sm font-bold text-blue-600">
                      {msg.recommendedPlan.price}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {msg.recommendedPlan.reason}
                    </p>
                  </div>
                )}

                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(action)}
                        className="flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {action.type === "payment" ? (
                          <CreditCard className="h-3.5 w-3.5" />
                        ) : (
                          <MessageCircle className="h-3.5 w-3.5" />
                        )}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="inline-block rounded-2xl bg-slate-100 px-4 py-3 text-sm dark:bg-slate-900">
                Thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-cyan-100 dark:bg-slate-900 dark:text-slate-200"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Ask about plans, tools, pricing..."
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />

              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-white disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}