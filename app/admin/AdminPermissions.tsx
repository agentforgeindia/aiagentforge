"use client";

// ============================================================
// AdminPermissions — client-side gate for admin pages.
// ============================================================
// Wraps the admin section. Reads the caller's role + permissions
// from Supabase (current_user_role / current_user_permissions
// helpers defined in sql/rbac.sql).
//
// Exposes a hook for every admin page / button:
//
//   const { role, permissions, has, ready } = useAdminPermissions();
//   if (!has("leads.add")) return null;
//
// "*" matches everything (founder). "leads.*" matches any
// "leads.xxx" check.
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

export type AdminPermissionsState = {
  /** True while we're loading the role from Supabase. */
  loading: boolean;
  /** True once we have a definitive answer (loading=false). */
  ready: boolean;
  /** True if the signed-in email maps to a row in admin_users. */
  isAdmin: boolean;
  /** Founder, admin, accounts, sales, etc. — or null if not admin. */
  role: string | null;
  /** Flat array of dotted permission strings. */
  permissions: string[];
  /** Signed-in email (for display). */
  email: string | null;
  /** Permission check helper — handles wildcard + prefix.* matching. */
  has: (perm: string) => boolean;
  /** Forcibly re-fetch from Supabase (e.g. after a role change). */
  refresh: () => Promise<void>;
  /** The signed-in user's own role, ignoring any "view as". */
  realRole: string | null;
  /** True when the signed-in user is the founder (role founder or "*"). */
  isFounder: boolean;
  /** Role id the founder is currently previewing, or null. */
  viewAs: string | null;
  /** Founder only — preview the backend as another role (null = back to founder). */
  setViewAs: (roleId: string | null) => void;
  /** Roles the founder can switch to (empty for non-founders). */
  availableRoles: AdminRoleOption[];
};

export type AdminRoleOption = { id: string; label: string; permissions: string[] };

const VIEW_AS_KEY = "af_admin_view_as";

const PermissionsCtx = createContext<AdminPermissionsState | null>(null);

function matchesPermission(perm: string, owned: string[]): boolean {
  // "any" = open to every admin regardless of role (e.g. shared AI tools).
  if (perm === "any") return true;
  if (!owned || owned.length === 0) return false;
  if (owned.includes("*")) return true;
  if (owned.includes(perm)) return true;
  const prefix = perm.split(".")[0] + ".*";
  return owned.includes(prefix);
}

export function AdminPermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AdminRoleOption[]>([]);
  const [viewAs, setViewAsState] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    const e = sess.session?.user?.email ?? null;
    setEmail(e);
    if (!e) {
      setRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Run both RPCs in parallel.
    const [{ data: r, error: e1 }, { data: perms, error: e2 }] =
      await Promise.all([
        supabase.rpc("current_user_role"),
        supabase.rpc("current_user_permissions"),
      ]);

    if (e1 || e2) {
      console.error("[admin-perms] load error:", e1 ?? e2);
      setRole(null);
      setPermissions([]);
    } else {
      const realRole = (r as string | null) ?? null;
      const realPerms = Array.isArray(perms) ? (perms as string[]) : [];
      setRole(realRole);
      setPermissions(realPerms);

      // Founder: load every role so the "View as" switcher can use it.
      if (realRole === "founder" || realPerms.includes("*")) {
        const { data: rows } = await supabase
          .from("admin_roles")
          .select("id, label, permissions")
          .order("id");
        setAvailableRoles(
          ((rows as AdminRoleOption[] | null) ?? []).map((x) => ({
            id: x.id,
            label: x.label || x.id,
            permissions: Array.isArray(x.permissions) ? x.permissions : [],
          })),
        );
        try {
          setViewAsState(window.localStorage.getItem(VIEW_AS_KEY));
        } catch {
          setViewAsState(null);
        }
      } else {
        setAvailableRoles([]);
        setViewAsState(null);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AdminPermissionsState>(() => {
    const isFounder = role === "founder" || permissions.includes("*");
    const preview =
      isFounder && viewAs && viewAs !== "founder"
        ? availableRoles.find((r) => r.id === viewAs) ?? null
        : null;
    const effRole = preview ? preview.id : role;
    const effPerms = preview ? preview.permissions : permissions;

    const setViewAs = (roleId: string | null) => {
      const next = roleId && roleId !== "founder" ? roleId : null;
      try {
        if (next) window.localStorage.setItem(VIEW_AS_KEY, next);
        else window.localStorage.removeItem(VIEW_AS_KEY);
      } catch {
        /* storage blocked */
      }
      setViewAsState(next);
    };

    return {
      loading,
      ready: !loading,
      isAdmin: !!role,
      role: effRole,
      permissions: effPerms,
      email,
      has: (p: string) => matchesPermission(p, effPerms),
      refresh: load,
      realRole: role,
      isFounder,
      viewAs: preview ? preview.id : null,
      setViewAs,
      availableRoles,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, role, permissions, email, viewAs, availableRoles]);

  return (
    <PermissionsCtx.Provider value={value}>{children}</PermissionsCtx.Provider>
  );
}

export function useAdminPermissions(): AdminPermissionsState {
  const ctx = useContext(PermissionsCtx);
  if (!ctx) {
    // Fallback so hooks called outside the provider don't crash
    // outright — they just see a permission-less state.
    return {
      loading: false,
      ready: true,
      isAdmin: false,
      role: null,
      permissions: [],
      email: null,
      has: () => false,
      refresh: async () => {},
      realRole: null,
      isFounder: false,
      viewAs: null,
      setViewAs: () => {},
      availableRoles: [],
    };
  }
  return ctx;
}

/** Convenience helper for one-off checks at the top of a render. */
export function useHasPermission(perm: string): boolean {
  return useAdminPermissions().has(perm);
}
