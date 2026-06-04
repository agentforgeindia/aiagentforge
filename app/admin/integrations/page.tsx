"use client";

// /admin/integrations — Connection status for all external services.

import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type IntegrationStatus = {
  key: string;
  name: string;
  category: string;
  description: string;
  docsUrl?: string;
  envVars: string[];
  connected: boolean;
  note?: string;
};

const INTEGRATIONS: Omit<IntegrationStatus, "connected">[] = [
  // Payments
  { key: "razorpay",   name: "Razorpay",    category: "Payments",     description: "Payment gateway for subscriptions",    docsUrl: "https://dashboard.razorpay.com",   envVars: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"] },
  // AI
  { key: "fal",        name: "FAL AI",      category: "AI",           description: "Image generation API",                 docsUrl: "https://fal.ai/dashboard",          envVars: ["FAL_KEY"] },
  { key: "openai",     name: "OpenAI",      category: "AI",           description: "Language model API",                   docsUrl: "https://platform.openai.com",       envVars: ["OPENAI_API_KEY"] },
  // Marketing
  { key: "meta",       name: "Meta Ads",    category: "Marketing",    description: "Facebook & Instagram lead ads",         docsUrl: "https://business.facebook.com",     envVars: ["META_WEBHOOK_VERIFY_TOKEN", "META_APP_SECRET", "META_PAGE_ACCESS_TOKEN"] },
  { key: "google",     name: "Google Ads",  category: "Marketing",    description: "Google lead form webhook",              docsUrl: "https://ads.google.com",            envVars: ["GOOGLE_LEADS_WEBHOOK_KEY"] },
  { key: "ga4",        name: "GA4",         category: "Analytics",    description: "Google Analytics 4",                   docsUrl: "https://analytics.google.com",      envVars: ["NEXT_PUBLIC_GA4_ID"] },
  // Email
  { key: "resend",     name: "Resend",      category: "Email",        description: "Transactional email delivery",          docsUrl: "https://resend.com/overview",       envVars: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"] },
  // Automation
  { key: "n8n",        name: "N8N",         category: "Automation",   description: "Workflow automation for AI agents",     docsUrl: "https://n8n.aiagentforge.in",       envVars: ["NEXT_PUBLIC_N8N_PRODUCTION_WEBHOOK", "N8N_AGENTFORGE_AI_WEBHOOK_URL"] },
  // Database
  { key: "supabase",   name: "Supabase",    category: "Database",     description: "Database, auth, storage",               docsUrl: "https://supabase.com/dashboard",    envVars: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] },
];

const CATEGORY_ORDER = ["Payments", "AI", "Marketing", "Analytics", "Email", "Automation", "Database"];

export default function IntegrationsPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("settings.view") || has("ai_costs.view");

  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    // Check which env vars are set via a lightweight API call
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const jwt = sess.session?.access_token;
      let envStatus: Record<string, boolean> = {};
      try {
        const res = await fetch("/api/admin/integrations/status", {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.ok) envStatus = await res.json();
      } catch { /* fallback: show all as unknown */ }

      const result = INTEGRATIONS.map((i) => ({
        ...i,
        connected: i.envVars.every((v) => envStatus[v] === true),
        note: i.envVars.some((v) => envStatus[v] === false)
          ? `Missing: ${i.envVars.filter((v) => !envStatus[v]).join(", ")}`
          : undefined,
      }));
      setStatuses(result);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const connected    = statuses.filter((s) => s.connected).length;
  const disconnected = statuses.filter((s) => !s.connected).length;

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: statuses.filter((s) => s.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <AdminShell
      breadcrumbs={[{ label: "Integrations" }]}
      title="Integrations"
      subtitle="Connection status for all external services"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Checking connections…</p>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <section className="grid gap-3 sm:grid-cols-3">
            <div className={`${adminCardCls} p-4`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Total</p>
              <p className="mt-1 text-3xl font-bold">{statuses.length}</p>
            </div>
            <div className={`${adminCardCls} p-4`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Connected</p>
              <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{connected}</p>
            </div>
            <div className={`${adminCardCls} p-4`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Disconnected</p>
              <p className={`mt-1 text-3xl font-bold ${disconnected > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-700 dark:text-slate-200"}`}>{disconnected}</p>
            </div>
          </section>

          {/* By category */}
          {byCategory.map(({ cat, items }) => (
            <section key={cat}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{cat}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <div key={s.key} className={`${adminCardCls} p-4`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${s.connected ? "bg-emerald-500" : "bg-rose-500"}`} />
                          <h3 className="text-sm font-bold">{s.name}</h3>
                        </div>
                        <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{s.description}</p>
                        {s.note && (
                          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{s.note}</p>
                        )}
                      </div>
                      {s.docsUrl && (
                        <a href={s.docsUrl} target="_blank" rel="noopener noreferrer" className={`shrink-0 ${adminMutedCls} hover:text-slate-900 dark:hover:text-slate-100`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {s.envVars.map((v) => (
                        <span key={v} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {v.length > 24 ? v.slice(0, 24) + "…" : v}
                        </span>
                      ))}
                    </div>
                    <p className={`mt-2 text-[11px] font-bold ${s.connected ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                      {s.connected ? "🟢 Connected" : "🔴 Disconnected"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function Loading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>;
}
function Denied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
