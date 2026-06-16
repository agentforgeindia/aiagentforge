"use client";

// /admin/settings — Company info, plans, credits, notifications config.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Setting = { key: string; value: unknown; label: string; category: string };

const SETTING_GROUPS = [
  {
    category: "company",
    title: "Company",
    keys: [
      { key: "company.name",          label: "Company Name",    type: "text" },
      { key: "company.gst",           label: "GST Number",      type: "text" },
      { key: "company.address",       label: "Address",         type: "text" },
      { key: "company.support_email", label: "Support Email",   type: "text" },
      { key: "company.website",       label: "Website",         type: "text" },
    ],
  },
  {
    category: "plans",
    title: "Plan Pricing",
    keys: [
      { key: "plans.starter.price",   label: "Starter Price (₹)",  type: "number" },
      { key: "plans.starter.credits", label: "Starter Credits",    type: "number" },
      { key: "plans.pro.price",       label: "Pro Price (₹)",      type: "number" },
      { key: "plans.pro.credits",     label: "Pro Credits",        type: "number" },
      { key: "plans.empire.price",    label: "Empire Price (₹)",   type: "number" },
      { key: "plans.empire.credits",  label: "Empire Credits",     type: "number" },
    ],
  },
  {
    category: "credits",
    title: "Credits",
    keys: [
      { key: "credits.free_on_signup", label: "Free Credits on Signup", type: "number" },
      { key: "credits.cost_per_image", label: "Credits Per Image",      type: "number" },
    ],
  },
  {
    category: "notifications",
    title: "Notifications",
    keys: [
      { key: "notifications.email_enabled", label: "Email Notifications Enabled", type: "boolean" },
      { key: "notifications.welcome_email", label: "Welcome Email Enabled",       type: "boolean" },
    ],
  },
];

export default function SystemSettingsPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("settings.view");
  const canManage = has("settings.manage");

  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [edited,   setEdited]   = useState<Record<string, unknown>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("key, value, label, category");
      const map: Record<string, unknown> = {};
      for (const row of (data as Setting[]) ?? []) {
        map[row.key] = row.value;
      }
      setSettings(map);
      setEdited({});
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  function getVal(key: string): unknown {
    return key in edited ? edited[key] : settings[key];
  }

  function patch(key: string, val: unknown) {
    setEdited((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  async function saveAll() {
    if (Object.keys(edited).length === 0) return;
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    for (const [key, value] of Object.entries(edited)) {
      await supabase.from("system_settings").upsert({
        key, value, updated_by: userId, updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
    }
    setEdited({});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const hasChanges = Object.keys(edited).length > 0;

  return (
    <AdminShell
      doodleType="settings"
      breadcrumbs={[{ label: "Settings" }]}
      title="System Settings"
      subtitle="Company info, plans, credits, notifications"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && hasChanges && (
            <button type="button" onClick={saveAll} disabled={saving} className={adminPrimaryBtnCls}>
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save All"}
            </button>
          )}
          {saved && <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-300">Saved!</span>}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading settings…</p>
      ) : (
        <div className="space-y-6">
          {SETTING_GROUPS.map((group) => (
            <section key={group.category} className={adminCardCls}>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {group.title}
                </p>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.keys.map((s) => {
                  const val = getVal(s.key);
                  const isChanged = s.key in edited;
                  return (
                    <div key={s.key}>
                      <label className={`block text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls} ${isChanged ? "text-indigo-600 dark:text-indigo-300" : ""}`}>
                        {s.label} {isChanged && "•"}
                      </label>
                      {s.type === "boolean" ? (
                        <select
                          className={`${adminInputCls} mt-1`}
                          value={String(val)}
                          onChange={(e) => patch(s.key, e.target.value === "true")}
                          disabled={!canManage}
                        >
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      ) : (
                        <input
                          className={`${adminInputCls} mt-1`}
                          type={s.type}
                          value={String(val ?? "")}
                          onChange={(e) => patch(s.key, s.type === "number" ? Number(e.target.value) : e.target.value)}
                          disabled={!canManage}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {!canManage && (
            <p className={`text-center text-xs ${adminMutedCls}`}>
              settings.manage permission required to edit.
            </p>
          )}
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

