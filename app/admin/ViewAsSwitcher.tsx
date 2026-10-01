"use client";

// ============================================================
// ViewAsSwitcher — founder-only "View as role" control.
// Lets the founder preview and use the backend exactly as any
// role sees it (sidebar, modules, buttons follow that role's
// permissions). ViewAsBanner shows while a preview is active.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useAdminPermissions } from "./AdminPermissions";

export function ViewAsSwitcher() {
  const { isFounder, viewAs, setViewAs, availableRoles } = useAdminPermissions();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isFounder || availableRoles.length === 0) return null;

  const current = availableRoles.find((r) => r.id === viewAs);
  const pick = (id: string | null) => {
    setViewAs(id);
    setOpen(false);
    router.push("/admin");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[13px] font-medium transition ${
          current
            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
        title="View the backend as another role"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Eye className="h-4 w-4" />
        <span className="hidden max-w-[120px] truncate md:inline">
          {current ? current.label : "View as"}
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 opacity-60 sm:block" />
      </button>

      {open && (
        <div role="menu" className="fixed inset-x-3 top-full z-50 mt-2 sm:absolute sm:inset-x-auto sm:right-0 overflow-hidden rounded-2xl sm:w-64 border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <p className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            View backend as
          </p>
          <div className="max-h-80 overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => pick(null)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-100"
            >
              <span className="flex-1 font-medium">Founder (my view)</span>
              {!current && <Check className="h-4 w-4 text-violet-600" />}
            </button>
            {availableRoles
              .filter((r) => r.id !== "founder")
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => pick(r.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="flex-1">
                    <span className="block">{r.label}</span>
                    <span className="block text-[11px] text-slate-400">
                      {r.permissions.includes("*") ? "Full access" : `${r.permissions.length} permissions`}
                    </span>
                  </span>
                  {current?.id === r.id && <Check className="h-4 w-4 text-violet-600" />}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ViewAsBanner() {
  const { isFounder, viewAs, setViewAs, availableRoles } = useAdminPermissions();
  const router = useRouter();
  const pathname = usePathname();
  if (!isFounder || !viewAs) return null;
  const label = availableRoles.find((r) => r.id === viewAs)?.label ?? viewAs;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-1.5 text-center text-[13px] font-medium text-amber-950">
      <Eye className="h-4 w-4" />
      <span>
        Viewing as <b>{label}</b> — sidebar, modules and buttons follow this role&apos;s permissions.
      </span>
      <button
        type="button"
        onClick={() => {
          setViewAs(null);
          if (pathname !== "/admin") router.refresh();
        }}
        className="inline-flex items-center gap-1 rounded-lg bg-amber-950/90 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-amber-950"
      >
        <EyeOff className="h-3.5 w-3.5" /> Back to founder view
      </button>
    </div>
  );
}
