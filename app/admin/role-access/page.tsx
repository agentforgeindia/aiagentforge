"use client";

// /admin/role-access — Founder-only view.
// Shows each role as a tab (right-aligned). For the selected role it lists
// exactly which backend features that role's permissions enable.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, RefreshCw, Check, Lock, ExternalLink } from "lucide-react";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { FEATURE_CATALOG, GROUP_ORDER, roleHasPerm } from "../featureCatalog";

type Role = { id: string; label: string; description: string | null; permissions: string[] };

export default function RoleAccessPage() {
  const { loading: loadingAuth, email, role: myRole, has } = useAdminPermissions();
  const isFounder = myRole === "founder" || has("*");

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isFounder) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("admin_roles")
        .select("id, label, description, permissions")
        .order("id");
      const list = (data as Role[]) ?? [];
      setRoles(list);
      // Default to the first non-founder role, else the first role.
      setActive(prev => prev || (list.find(r => r.id !== "founder")?.id ?? list[0]?.id ?? ""));
      setLoading(false);
    })();
  }, [isFounder, refreshKey]);

  const activeRole = roles.find(r => r.id === active) ?? null;

  // Group the catalog and compute enabled/disabled per the active role.
  const grouped = useMemo(() => {
    const perms = activeRole?.permissions ?? [];
    return GROUP_ORDER.map(group => {
      const items = FEATURE_CATALOG.filter(f => f.group === group).map(f => ({
        ...f,
        enabled: roleHasPerm(f.perm, perms),
      }));
      return { group, items, enabledCount: items.filter(i => i.enabled).length };
    }).filter(g => g.items.length > 0);
  }, [activeRole]);

  const totals = useMemo(() => {
    const perms = activeRole?.permissions ?? [];
    const enabled = FEATURE_CATALOG.filter(f => roleHasPerm(f.perm, perms)).length;
    return { enabled, total: FEATURE_CATALOG.length };
  }, [activeRole]);

  if (loadingAuth) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking access…</main>;
  }
  if (!email || !isFounder) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Founder access only</h1>
          <p className="mt-1 text-xs text-slate-500">This page is restricted to the founder.</p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="team"
      breadcrumbs={[{ label: "Role Access" }]}
      title="Role Access"
      subtitle="See exactly which backend features each role can access"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey(k => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      {/* Role tabs — right aligned (right → left) */}
      <div className="mb-4 flex flex-wrap justify-end gap-1.5">
        {loading ? (
          <span className={`text-sm ${adminMutedCls}`}>Loading roles…</span>
        ) : (
          roles.map(r => {
            const isActive = r.id === active;
            const isFull = (r.permissions ?? []).includes("*");
            return (
              <button
                key={r.id}
                onClick={() => setActive(r.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {r.label}
                <span className={`rounded px-1 text-[10px] tabular-nums ${isActive ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                  {isFull ? "ALL" : (r.permissions?.length ?? 0)}
                </span>
              </button>
            );
          })
        )}
      </div>

      {activeRole && (
        <>
          {/* Role summary */}
          <div className={`${adminCardCls} mb-4 p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-black">{activeRole.label}</p>
                {activeRole.description && <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{activeRole.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {totals.enabled === totals.total ? "All" : `${totals.enabled}/${totals.total}`}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${adminMutedCls}`}>Features enabled</p>
              </div>
            </div>
          </div>

          {/* Feature groups */}
          <div className="grid gap-4 md:grid-cols-2">
            {grouped.map(g => (
              <div key={g.group} className={`${adminCardCls} p-4`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black">{g.group}</p>
                  <span className={`text-[11px] font-bold ${adminMutedCls}`}>{g.enabledCount}/{g.items.length}</span>
                </div>
                <div className="space-y-1.5">
                  {g.items.map(f => (
                    <div
                      key={f.href}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        f.enabled
                          ? "border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-400/20 dark:bg-emerald-500/5"
                          : "border-slate-200 bg-slate-50/60 opacity-60 dark:border-slate-800 dark:bg-slate-800/30"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {f.enabled
                          ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          : <Lock className="h-3.5 w-3.5 text-slate-400" />}
                        <span className={f.enabled ? "font-bold" : "font-medium line-through decoration-slate-300"}>{f.label}</span>
                      </span>
                      {f.enabled && (
                        <Link href={f.href} className="text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className={`mt-4 text-center text-[11px] ${adminMutedCls}`}>
            To change what a role can access, edit its permissions in{" "}
            <Link href="/admin/team" className="font-bold text-cyan-600 hover:underline dark:text-cyan-300">Team → Roles</Link>.
          </p>
        </>
      )}
    </AdminShell>
  );
}
