"use client";

// ============================================================
// CommandPalette — Cmd+K / Ctrl+K universal search.
// ============================================================
// Press Cmd+K (mac) / Ctrl+K (win/linux) on ANY /admin page.
// Modal opens centered, input focused. Type → results across
// customers / leads / payments / tasks. Arrow keys cycle the
// active result. Enter navigates. Esc closes.
//
// Queries admin_search() RPC which is permission-gated server-
// side. The palette automatically hides groups the caller can't
// see.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Receipt,
  Search,
  Users,
  UserPlus,
  X,
  CheckSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type CustomerHit = {
  id: string;
  name: string | null;
  email: string | null;
  plan: string | null;
  credits: number;
  health: string | null;
};

type LeadHit = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  source: string;
  status: string;
};

type PaymentHit = {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  status: string;
  buyer_name: string | null;
  buyer_email: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

type TaskHit = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_at: string | null;
};

type Results = {
  customers: CustomerHit[];
  leads: LeadHit[];
  payments: PaymentHit[];
  tasks: TaskHit[];
};

type FlatItem =
  | { kind: "customer"; item: CustomerHit }
  | { kind: "lead";     item: LeadHit }
  | { kind: "payment";  item: PaymentHit }
  | { kind: "task";     item: TaskHit };

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open/close via keyboard.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus the input when opened, reset on close.
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebounced("");
      setResults(null);
      setActiveIdx(0);
      // Defer focus until the input is in the DOM.
      setTimeout(() => inputRef.current?.focus(), 0);
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Debounce — 220 ms.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 220);
    return () => window.clearTimeout(t);
  }, [query]);

  // Run the RPC whenever the debounced value changes.
  useEffect(() => {
    if (!open) return;
    const q = debounced.trim();
    if (q.length === 0) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("admin_search", {
        p_query: q,
        p_limit: 6,
      });
      if (cancelled) return;
      if (!error && data) {
        setResults(data as Results);
        setActiveIdx(0);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  // Flatten the results into a single list for keyboard navigation.
  const flat: FlatItem[] = useMemo(() => {
    if (!results) return [];
    const out: FlatItem[] = [];
    for (const c of results.customers) out.push({ kind: "customer", item: c });
    for (const l of results.leads)     out.push({ kind: "lead",     item: l });
    for (const p of results.payments)  out.push({ kind: "payment",  item: p });
    for (const t of results.tasks)     out.push({ kind: "task",     item: t });
    return out;
  }, [results]);

  function navigate(item: FlatItem) {
    setOpen(false);
    switch (item.kind) {
      case "customer":
        router.push(`/admin/customers/${item.item.id}`);
        break;
      case "lead":
        router.push(`/admin/leads/${item.item.id}`);
        break;
      case "payment":
        router.push(`/invoice/${item.item.id}`);
        break;
      case "task":
        router.push("/admin/tasks");
        break;
    }
  }

  function onKeyDownInput(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIdx];
      if (item) navigate(item);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/40 px-3 pt-[10vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-[#0f1218] dark:ring-slate-700">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDownInput}
            placeholder="Search customers, leads, payments, tasks…"
            className="flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Esc
          </kbd>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto">
          {debounced.trim().length === 0 ? (
            <EmptyHint />
          ) : loading ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Searching…
            </p>
          ) : !results ? null : flat.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Nothing found for "{debounced}".
            </p>
          ) : (
            <ResultList
              results={results}
              flat={flat}
              activeIdx={activeIdx}
              setActiveIdx={setActiveIdx}
              onSelect={navigate}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800">
              ↑↓
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800">
              ⏎
            </kbd>
            open
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800">
              {typeof navigator !== "undefined" &&
              navigator.platform.toLowerCase().includes("mac")
                ? "⌘K"
                : "Ctrl+K"}
            </kbd>
            toggle
          </span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Result list
// ────────────────────────────────────────────────────────────

function ResultList({
  results,
  flat,
  activeIdx,
  setActiveIdx,
  onSelect,
}: {
  results: Results;
  flat: FlatItem[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onSelect: (it: FlatItem) => void;
}) {
  let cursor = 0;
  const groups: { label: string; icon: React.ReactNode; items: FlatItem[]; startIdx: number }[] = [];

  if (results.customers.length > 0) {
    groups.push({
      label: "Customers",
      icon: <Users className="h-3 w-3" />,
      items: results.customers.map((c) => ({ kind: "customer", item: c } as FlatItem)),
      startIdx: cursor,
    });
    cursor += results.customers.length;
  }
  if (results.leads.length > 0) {
    groups.push({
      label: "Leads",
      icon: <UserPlus className="h-3 w-3" />,
      items: results.leads.map((l) => ({ kind: "lead", item: l } as FlatItem)),
      startIdx: cursor,
    });
    cursor += results.leads.length;
  }
  if (results.payments.length > 0) {
    groups.push({
      label: "Payments",
      icon: <Receipt className="h-3 w-3" />,
      items: results.payments.map((p) => ({ kind: "payment", item: p } as FlatItem)),
      startIdx: cursor,
    });
    cursor += results.payments.length;
  }
  if (results.tasks.length > 0) {
    groups.push({
      label: "Tasks",
      icon: <CheckSquare className="h-3 w-3" />,
      items: results.tasks.map((t) => ({ kind: "task", item: t } as FlatItem)),
      startIdx: cursor,
    });
    cursor += results.tasks.length;
  }

  return (
    <ul className="py-1">
      {groups.map((g) => (
        <li key={g.label}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {g.icon}
            {g.label}
          </div>
          <ul>
            {g.items.map((it, k) => {
              const idx = g.startIdx + k;
              const active = idx === activeIdx;
              return (
                <li key={`${g.label}-${k}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => onSelect(it)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-100"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="min-w-0">
                      <Row it={it} />
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </button>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function Row({ it }: { it: FlatItem }) {
  if (it.kind === "customer") {
    const c = it.item;
    return (
      <>
        <p className="truncate font-bold">
          {c.name?.trim() || c.email || "(unnamed)"}
        </p>
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {[c.email, c.plan ?? "Free", `${c.credits} credits`, c.health]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </>
    );
  }
  if (it.kind === "lead") {
    const l = it.item;
    return (
      <>
        <p className="truncate font-bold">
          {l.name}
          {l.business_name && (
            <span className="ml-2 text-xs font-normal text-slate-500">
              · {l.business_name}
            </span>
          )}
        </p>
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {[l.phone, l.email, l.source, l.status].filter(Boolean).join(" · ")}
        </p>
      </>
    );
  }
  if (it.kind === "payment") {
    const p = it.item;
    return (
      <>
        <p className="truncate font-bold">
          ₹{Number(p.amount).toLocaleString("en-IN")} · {p.plan}
        </p>
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {[p.buyer_name, p.buyer_email, p.status, p.razorpay_payment_id]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </>
    );
  }
  const t = it.item;
  return (
    <>
      <p className="truncate font-bold">{t.title}</p>
      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
        {[t.status, t.priority, t.assigned_to].filter(Boolean).join(" · ")}
      </p>
    </>
  );
}

function EmptyHint() {
  return (
    <div className="px-4 py-8 text-center">
      <Search className="mx-auto h-6 w-6 text-slate-300" />
      <p className="mt-2 text-sm text-slate-500">
        Type to search across the entire console.
      </p>
      <p className="mt-1 text-[11px] text-slate-400">
        Customers · Leads · Payments · Tasks
      </p>
    </div>
  );
}
