"use client";

// ============================================================
// /admin/team — founder/admin view of every admin user, with
// add / change role / deactivate controls.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  RefreshCw,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Role = {
  id: string;
  label: string;
  description: string | null;
  permissions: string[];
};

type Member = {
  email: string;
  role: string | null;
  active: boolean;
  full_name: string | null;
  last_login_at: string | null;
  created_at: string;
};

export default function AdminTeamPage() {
  const { loading, has, email: meEmail, refresh } = useAdminPermissions();

  const canView = has("team.view");
  const canManage = has("team.add");

  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("sales");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    setLoadingData(true);
    (async () => {
      const [{ data: r }, { data: m }] = await Promise.all([
        supabase
          .from("admin_roles")
          .select("id, label, description, permissions")
          .order("id"),
        supabase
          .from("admin_users")
          .select("email, role, active, full_name, last_login_at, created_at")
          .order("created_at", { ascending: false }),
      ]);
      setRoles((r ?? []) as Role[]);
      setMembers((m ?? []) as Member[]);
      setLoadingData(false);
    })();
  }, [canView, refreshKey]);

  const rolesById = useMemo(() => {
    const map: Record<string, Role> = {};
    for (const r of roles) map[r.id] = r;
    return map;
  }, [roles]);

  async function addMember() {
    setError(null);
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email.");
      return;
    }
    if (!newRole) {
      setError("Pick a role.");
      return;
    }
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const { error: insErr } = await supabase.from("admin_users").upsert(
      {
        email: cleanEmail,
        role: newRole,
        full_name: newName.trim() || null,
        active: true,
        created_by: sess.session?.user?.id ?? null,
      },
      { onConflict: "email" },
    );
    if (!insErr) {
      // Audit it.
      await supabase.rpc("log_admin_action", {
        p_action: "team.add",
        p_target_type: "admin_user",
        p_target_id: cleanEmail,
        p_details: { role: newRole, full_name: newName.trim() || null },
      });
    }
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setShowAdd(false);
    setNewEmail("");
    setNewName("");
    setNewRole("sales");
    setRefreshKey((k) => k + 1);
  }

  async function changeRole(memberEmail: string, role: string) {
    const { error: updErr } = await supabase
      .from("admin_users")
      .update({ role })
      .eq("email", memberEmail);
    if (updErr) {
      alert(`Failed: ${updErr.message}`);
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: "team.edit_role",
      p_target_type: "admin_user",
      p_target_id: memberEmail,
      p_details: { new_role: role },
    });
    setRefreshKey((k) => k + 1);
    if (memberEmail.toLowerCase() === (meEmail ?? "").toLowerCase()) {
      refresh();
    }
  }

  async function toggleActive(memberEmail: string, currentActive: boolean) {
    const next = !currentActive;
    if (!next && !confirm(`Deactivate ${memberEmail}? They will lose access immediately.`)) {
      return;
    }
    const { error: updErr } = await supabase
      .from("admin_users")
      .update({ active: next })
      .eq("email", memberEmail);
    if (updErr) {
      alert(`Failed: ${updErr.message}`);
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: next ? "team.activate" : "team.deactivate",
      p_target_type: "admin_user",
      p_target_id: memberEmail,
    });
    setRefreshKey((k) => k + 1);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }
  if (!canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>team.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="team"
      breadcrumbs={[{ label: "Team" }]}
      title="Team"
      subtitle={`${members.length} member${members.length === 1 ? "" : "s"}`}
      email={meEmail}
      actions={
        <>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className={adminSecondaryBtnCls}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowAdd((s) => !s)}
              className={adminPrimaryBtnCls}
            >
              {showAdd ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              {showAdd ? "Close" : "Add member"}
            </button>
          )}
        </>
      }
    >
      {showAdd && canManage && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Add a team member
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Email
              </span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="niranjan@aiagentforge.in"
                className={adminInputCls}
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Full name
              </span>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Niranjan"
                className={adminInputCls}
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Role
              </span>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className={adminInputCls}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className={adminSecondaryBtnCls}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addMember}
              disabled={saving}
              className={adminPrimaryBtnCls}
            >
              {saving ? "Adding…" : "Add member"}
            </button>
          </div>
        </section>
      )}

      {/* Members list */}
      <div className={`${adminCardCls}`}>
        {loadingData ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
        ) : members.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            No team members yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {members.map((m) => {
              const isSelf =
                m.email.toLowerCase() === (meEmail ?? "").toLowerCase();
              return (
                <li
                  key={m.email}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold">
                        {m.full_name?.trim() || m.email}
                      </p>
                      {isSelf && (
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                          You
                        </span>
                      )}
                      {!m.active && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className={`mt-0.5 truncate text-xs ${adminMutedCls}`}>
                      {m.email}
                    </p>
                    <p className={`text-[11px] ${adminMutedCls}`}>
                      Last login:{" "}
                      {m.last_login_at ? formatDateTime(m.last_login_at) : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={m.role ?? ""}
                      onChange={(e) => changeRole(m.email, e.target.value)}
                      disabled={!canManage || (m.role === "founder" && !isSelf)}
                      className={`${adminInputCls} sm:max-w-[180px]`}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => toggleActive(m.email, m.active)}
                        disabled={m.role === "founder"}
                        className={`${adminSecondaryBtnCls} disabled:opacity-40`}
                      >
                        {m.active ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Role legend */}
      <div className={`${adminCardCls} mt-4 p-4`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Roles
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {roles.map((r) => (
            <li
              key={r.id}
              className="rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <p className="text-sm font-bold">{r.label}</p>
              <p className={`mt-0.5 text-xs ${adminMutedCls}`}>
                {r.description}
              </p>
              <p className="mt-2 text-[11px] font-mono leading-5 text-slate-500 dark:text-slate-400">
                {r.permissions.slice(0, 6).join(" · ")}
                {r.permissions.length > 6 && ` … +${r.permissions.length - 6}`}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

