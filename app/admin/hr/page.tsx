"use client";

// /admin/hr — HR Module: employees, salary, leaves.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Users, DollarSign, Calendar, Plus, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Employee = { id: string; email: string; full_name: string; role: string; department: string | null; joining_date: string | null; base_salary: number; status: string; phone: string | null };
type Leave    = { id: string; employee_id: string; leave_type: string; from_date: string; to_date: string; days: number; reason: string | null; status: string };
type Salary   = { id: string; employee_id: string; month: string; base_salary: number; incentive: number; deductions: number; net_salary: number; paid: boolean; paid_on: string | null };

const TABS = ["Employees", "Salary", "Leaves"] as const;
type Tab = typeof TABS[number];

export default function HRPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("hr.view");
  const canManage = has("hr.manage");

  const [tab, setTab]               = useState<Tab>("Employees");
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [leaves, setLeaves]         = useState<Leave[]>([]);
  const [salaries, setSalaries]     = useState<Salary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNew, setShowNew]       = useState(false);

  // Employee form
  const [fName,   setFName]   = useState("");
  const [fEmail,  setFEmail]  = useState("");
  const [fRole,   setFRole]   = useState("sales");
  const [fDept,   setFDept]   = useState("");
  const [fJoin,   setFJoin]   = useState("");
  const [fSalary, setFSalary] = useState("");
  const [fPhone,  setFPhone]  = useState("");
  const [fSaving, setFSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const [{ data: emp }, { data: lea }, { data: sal }] = await Promise.all([
        supabase.from("hr_employees").select("*").order("full_name"),
        supabase.from("hr_leaves").select("*").order("from_date", { ascending: false }),
        supabase.from("hr_salary_records").select("*").order("month", { ascending: false }),
      ]);
      setEmployees((emp as Employee[]) ?? []);
      setLeaves((lea as Leave[]) ?? []);
      setSalaries((sal as Salary[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!fName || !fEmail) return;
    setFSaving(true);
    await supabase.from("hr_employees").insert({
      full_name: fName, email: fEmail, role: fRole,
      department: fDept || null, joining_date: fJoin || null,
      base_salary: parseFloat(fSalary) || 0, phone: fPhone || null,
    });
    setFName(""); setFEmail(""); setFRole("sales"); setFDept(""); setFJoin(""); setFSalary(""); setFPhone("");
    setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  async function approveLeave(id: string, status: "approved" | "rejected") {
    await supabase.from("hr_leaves").update({ status, approved_by: email ?? "admin" }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  async function markSalaryPaid(id: string) {
    await supabase.from("hr_salary_records").update({ paid: true, paid_on: new Date().toISOString().slice(0, 10) }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const totalSalaryBill = employees.filter((e) => e.status === "active").reduce((s, e) => s + e.base_salary, 0);
  const pendingLeaves   = leaves.filter((l) => l.status === "pending").length;
  const unpaidSalaries  = salaries.filter((s) => !s.paid).length;

  return (
    <AdminShell
      breadcrumbs={[{ label: "HR" }]}
      title="HR Module"
      subtitle="Employees, salary records, and leave management"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && tab === "Employees" && <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}><Plus className="h-3.5 w-3.5" />Add Employee</button>}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {/* Stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className={`${adminCardCls} p-4`}>
          <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}><Users className="h-3.5 w-3.5"/>Active Employees</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{employees.filter((e) => e.status === "active").length}</p>
        </div>
        <div className={`${adminCardCls} p-4`}>
          <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}><DollarSign className="h-3.5 w-3.5"/>Monthly Salary Bill</p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-300 tabular-nums">₹{totalSalaryBill.toLocaleString("en-IN")}</p>
        </div>
        <div className={`${adminCardCls} p-4`}>
          <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}><Calendar className="h-3.5 w-3.5"/>Pending Leaves</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${pendingLeaves > 0 ? "text-amber-600 dark:text-amber-300" : ""}`}>{pendingLeaves}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-xs font-bold transition ${tab === t ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p> : (
        <>
          {/* Employees Tab */}
          {tab === "Employees" && (
            <>
              {showNew && canManage && (
                <section className={`${adminCardCls} mb-4 p-4`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Add Employee</p>
                    <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
                  </div>
                  <form onSubmit={addEmployee} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input className={adminInputCls} placeholder="Full name *" value={fName} onChange={(e) => setFName(e.target.value)} required />
                    <input className={adminInputCls} placeholder="Email *" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} required />
                    <input className={adminInputCls} placeholder="Role (e.g. sales)" value={fRole} onChange={(e) => setFRole(e.target.value)} />
                    <input className={adminInputCls} placeholder="Department" value={fDept} onChange={(e) => setFDept(e.target.value)} />
                    <input className={adminInputCls} placeholder="Joining date" type="date" value={fJoin} onChange={(e) => setFJoin(e.target.value)} />
                    <input className={adminInputCls} placeholder="Base salary (₹)" type="number" value={fSalary} onChange={(e) => setFSalary(e.target.value)} />
                    <input className={adminInputCls} placeholder="Phone" value={fPhone} onChange={(e) => setFPhone(e.target.value)} />
                    <button type="submit" disabled={fSaving} className={`${adminPrimaryBtnCls} sm:col-span-2 justify-center`}>{fSaving ? "Saving…" : "Add Employee"}</button>
                  </form>
                </section>
              )}
              <section className={`${adminCardCls} overflow-hidden`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      {["Name", "Role", "Department", "Joining Date", "Base Salary", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5">
                          <p className="text-xs font-bold">{emp.full_name}</p>
                          <p className={`text-[11px] ${adminMutedCls}`}>{emp.email}</p>
                        </td>
                        <td className={`px-4 py-2.5 text-xs capitalize ${adminMutedCls}`}>{emp.role}</td>
                        <td className={`px-4 py-2.5 text-xs ${adminMutedCls}`}>{emp.department ?? "—"}</td>
                        <td className={`px-4 py-2.5 text-xs ${adminMutedCls}`}>{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}</td>
                        <td className="px-4 py-2.5 text-xs font-bold tabular-nums">₹{emp.base_salary.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${emp.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {employees.length === 0 && <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No employees added yet.</p>}
              </section>
            </>
          )}

          {/* Leaves Tab */}
          {tab === "Leaves" && (
            <section className={`${adminCardCls} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Employee", "Type", "From", "To", "Days", "Reason", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaves.map((l) => {
                    const emp = employees.find((e) => e.id === l.employee_id);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 text-xs font-medium">{emp?.full_name ?? "—"}</td>
                        <td className="px-4 py-2.5"><span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 capitalize">{l.leave_type}</span></td>
                        <td className={`px-4 py-2.5 text-xs ${adminMutedCls}`}>{new Date(l.from_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                        <td className={`px-4 py-2.5 text-xs ${adminMutedCls}`}>{new Date(l.to_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                        <td className="px-4 py-2.5 text-xs font-bold tabular-nums">{l.days}d</td>
                        <td className={`max-w-xs px-4 py-2.5 text-xs ${adminMutedCls}`}>{l.reason ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : l.status === "rejected" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {canManage && l.status === "pending" && (
                            <div className="flex gap-1">
                              <button type="button" onClick={() => approveLeave(l.id, "approved")} className="rounded-md bg-emerald-600 p-1 text-white hover:bg-emerald-500"><Check className="h-3 w-3" /></button>
                              <button type="button" onClick={() => approveLeave(l.id, "rejected")} className="rounded-md bg-rose-500 p-1 text-white hover:bg-rose-400"><X className="h-3 w-3" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {leaves.length === 0 && <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No leave requests.</p>}
            </section>
          )}

          {/* Salary Tab */}
          {tab === "Salary" && (
            <section className={`${adminCardCls} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Employee", "Month", "Base", "Incentive", "Deductions", "Net", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {salaries.map((s) => {
                    const emp = employees.find((e) => e.id === s.employee_id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 text-xs font-medium">{emp?.full_name ?? "—"}</td>
                        <td className={`px-4 py-2.5 text-xs ${adminMutedCls}`}>{new Date(s.month).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}</td>
                        <td className="px-4 py-2.5 text-xs tabular-nums">₹{s.base_salary.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5 text-xs tabular-nums text-emerald-600 dark:text-emerald-300">₹{s.incentive.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5 text-xs tabular-nums text-rose-600 dark:text-rose-300">-₹{s.deductions.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5 text-xs font-bold tabular-nums">₹{s.net_salary.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.paid ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
                            {s.paid ? `Paid ${s.paid_on ? new Date(s.paid_on).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}` : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {canManage && !s.paid && (
                            <button type="button" onClick={() => markSalaryPaid(s.id)} className={adminPrimaryBtnCls}>Mark Paid</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {salaries.length === 0 && <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No salary records. Add employees first.</p>}
            </section>
          )}
        </>
      )}
    </AdminShell>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
        <p className="mt-1 text-xs text-slate-500">hr.view permission required.</p>
      </div>
    </main>
  );
}
