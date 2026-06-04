"use client";

// /admin/agents — Enable/disable agents, set credits cost, prompt version.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Save, Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type AgentConfig = {
  agent_slug:       string;
  display_name:     string;
  description:      string | null;
  enabled:          boolean;
  credits_per_gen:  number;
  cost_per_gen_usd: number;
  prompt_version:   string | null;
  notes:            string | null;
  updated_at:       string;
};

const AGENT_ICONS: Record<string, string> = {
  jewellery:          "💎",
  textile:            "🧵",
  productography:     "📸",
  "ugc":              "🎬",
  "social-ads":       "📢",
  trendforge:         "📈",
  "election-campaign":"🗳️",
};

export default function AgentsPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("agents.view");
  const canManage = has("agents.manage");

  const [agents, setAgents]     = useState<AgentConfig[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [edited, setEdited]     = useState<Record<string, Partial<AgentConfig>>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("agent_configs_list");
      setAgents((data as AgentConfig[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  function patch(slug: string, field: keyof AgentConfig, value: unknown) {
    setEdited((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], [field]: value },
    }));
  }

  function getVal<K extends keyof AgentConfig>(slug: string, field: K, original: AgentConfig[K]): AgentConfig[K] {
    return (edited[slug]?.[field] as AgentConfig[K]) ?? original;
  }

  async function saveAgent(slug: string) {
    const changes = edited[slug];
    if (!changes) return;
    setSaving(slug);
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    await supabase
      .from("agent_costs")
      .update({
        ...("enabled"          in changes ? { enabled:                  changes.enabled }          : {}),
        ...("credits_per_gen"  in changes ? { credits_per_gen:          changes.credits_per_gen }  : {}),
        ...("cost_per_gen_usd" in changes ? { cost_per_generation_usd:  changes.cost_per_gen_usd } : {}),
        ...("prompt_version"   in changes ? { prompt_version:           changes.prompt_version }   : {}),
        ...("notes"            in changes ? { notes:                    changes.notes }            : {}),
        ...("display_name"     in changes ? { display_name:             changes.display_name }     : {}),
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("agent_slug", slug);
    setEdited((prev) => { const n = { ...prev }; delete n[slug]; return n; });
    setSaving(null);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const enabledCount  = agents.filter((a) => getVal(a.agent_slug, "enabled", a.enabled)).length;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Agents" }]}
      title="Agent Management"
      subtitle="Enable/disable AI agents, set credits, prompt versions"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading agents…</p>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <section className="grid gap-3 sm:grid-cols-3">
            <div className={`${adminCardCls} p-4`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Total Agents</p>
              <p className="mt-1 text-3xl font-bold">{agents.length}</p>
            </div>
            <div className={`${adminCardCls} p-4`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Active</p>
              <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{enabledCount}</p>
            </div>
            <div className={`${adminCardCls} p-4`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Disabled</p>
              <p className="mt-1 text-3xl font-bold text-slate-400">{agents.length - enabledCount}</p>
            </div>
          </section>

          {/* Agent cards */}
          <div className="grid gap-4 lg:grid-cols-2">
            {agents.map((a) => {
              const isEdited = Boolean(edited[a.agent_slug]);
              const enabled  = getVal(a.agent_slug, "enabled",         a.enabled);
              const credits  = getVal(a.agent_slug, "credits_per_gen", a.credits_per_gen);
              const cost     = getVal(a.agent_slug, "cost_per_gen_usd",a.cost_per_gen_usd);
              const version  = getVal(a.agent_slug, "prompt_version",  a.prompt_version);
              const name     = getVal(a.agent_slug, "display_name",    a.display_name);
              const notes    = getVal(a.agent_slug, "notes",           a.notes);

              return (
                <div key={a.agent_slug} className={`${adminCardCls} p-4 ${!enabled ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{AGENT_ICONS[a.agent_slug] ?? "🤖"}</span>
                      <div>
                        <h3 className="text-sm font-bold">{name}</h3>
                        <p className={`text-[11px] ${adminMutedCls}`}>{a.agent_slug}</p>
                      </div>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => patch(a.agent_slug, "enabled", !enabled)}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                          enabled
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {enabled ? "Enabled" : "Disabled"}
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Display Name</label>
                      <input
                        className={`${adminInputCls} mt-1`}
                        value={name ?? ""}
                        onChange={(e) => patch(a.agent_slug, "display_name", e.target.value)}
                        disabled={!canManage}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Credits Per Generation</label>
                      <input
                        className={`${adminInputCls} mt-1`}
                        type="number"
                        value={credits}
                        onChange={(e) => patch(a.agent_slug, "credits_per_gen", parseInt(e.target.value))}
                        disabled={!canManage}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Cost Per Gen (USD)</label>
                      <input
                        className={`${adminInputCls} mt-1`}
                        type="number"
                        step="0.001"
                        value={cost}
                        onChange={(e) => patch(a.agent_slug, "cost_per_gen_usd", parseFloat(e.target.value))}
                        disabled={!canManage}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Prompt Version</label>
                      <input
                        className={`${adminInputCls} mt-1`}
                        value={version ?? ""}
                        onChange={(e) => patch(a.agent_slug, "prompt_version", e.target.value)}
                        disabled={!canManage}
                        placeholder="v1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Notes</label>
                      <input
                        className={`${adminInputCls} mt-1`}
                        value={notes ?? ""}
                        onChange={(e) => patch(a.agent_slug, "notes", e.target.value)}
                        disabled={!canManage}
                        placeholder="Internal notes"
                      />
                    </div>
                  </div>

                  {canManage && isEdited && (
                    <button
                      type="button"
                      onClick={() => saveAgent(a.agent_slug)}
                      disabled={saving === a.agent_slug}
                      className={`${adminPrimaryBtnCls} mt-3 w-full justify-center`}
                    >
                      <Save className="h-3.5 w-3.5" />
                      {saving === a.agent_slug ? "Saving…" : "Save Changes"}
                    </button>
                  )}

                  <p className={`mt-2 text-[10px] ${adminMutedCls}`}>
                    Updated: {new Date(a.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                  </p>
                </div>
              );
            })}
          </div>
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
        <p className="mt-1 text-xs text-slate-500">agents.view permission required.</p>
      </div>
    </main>
  );
}
