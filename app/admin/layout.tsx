// ============================================================
// Admin section layout — wraps every /admin/* route in the
// AdminPermissionsProvider so usePermission() works anywhere.
// ============================================================

import { AdminPermissionsProvider } from "./AdminPermissions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminPermissionsProvider>{children}</AdminPermissionsProvider>;
}
