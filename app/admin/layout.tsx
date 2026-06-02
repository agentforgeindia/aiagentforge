// ============================================================
// Admin section layout — wraps every /admin/* route in the
// AdminPermissionsProvider so usePermission() works anywhere.
// ============================================================
// Admin pages are gated by auth + permissions that resolve at
// runtime — prerendering them at build time produces an empty
// "Access denied" shell that triggers a hydration crash + soft
// reload the moment the real user arrives. Marking the section
// fully dynamic skips that prerender entirely and removes the
// flash-then-redirect symptom on Ctrl+R.
// ============================================================

import { AdminPermissionsProvider } from "./AdminPermissions";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminPermissionsProvider>{children}</AdminPermissionsProvider>;
}
