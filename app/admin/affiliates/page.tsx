"use client";

// /admin/affiliates â€” Affiliate / Partner management.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Plus, X, Users, IndianRupee, Gift, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Affiliate = {
  id: string; name: string; email: string; ref_code: string;
  commission_pct: number; status: string;
  referrals: number; earned: number; paid: number;
};
type Totals = {
  affiliates: number; active: number; referrals: number;
  pending_payout: number; total_earned: number; total_paid: number;
};
type Data = { totals: Totals; affiliates: Affiliate[] };

function genCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, "").slice(0, 6).toUpperCase() || "AGENT";
  return base + Math.floor(100 + Math.random() * 900);
}

export default function AffiliatesPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("affiliates.view");
  const canManage = has("affiliates.manage");

  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied]   = useState<string | null>(null);

  // form
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fPct, setFPct]   = useState("10");
  const [fSaving, setFSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("affiliate_overview");
      setData(m as Data);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function addAffiliate(e: React.FormEvent) {
    e.preventDefault();
    if (!fName || !fEmail) return;
    setFSaving(true);
    await supabase.from("affiliates").insert({
      name: fName, email: fEmail, phone: fPhone || null,
      ref_code: genCode(fName), commission_pct: parseFloat(fPct) || 10,
    });
    setFName(""); setFEmail(""); setFPhone(""); setFPct("10");
    setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  function copyLink(code: string) {
    navigator.clipboard.writeText(`https://aiagentforge.in/?ref=${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  // Change commission % anytime.
  async function setCommission(id: string, pct: number) {
    await supabase.from("affiliates").update({ commission_pct: pct }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  // Pause / activate a partner.
  async function setStatus(id: string, status: string) {
    await supabase.from("affiliates").update({ status }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  async function removePartner(id: string) {
    if (!confirm("Delete this partner and all their referrals?")) return;
    await supabase.from("affiliates").delete().eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  // Manually record a referral sale â†’ commission auto-computed.
  async function addReferral(aff: Affiliate) {
    const email = prompt("Referred customer's email/name:");
    if (!email) return;
    const amtStr = prompt("Sale amount (₹):");
    const amount = parseFloat(amtStr ?? "");
    if (isNaN(amount)) return;
    const commission = Math.round(amount * (aff.commission_pct / 100) * 100) / 100;
    await supabase.from("affiliate_referrals").insert({
      affiliate_id: aff.id, referred_email: email,
      amount_inr: amount, commission_inr: commission, status: "confirmed",
    });
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Affiliates" }]}
      title="Affiliate Partners"
      subtitle="Referral partners, commissions, payouts"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}><Plus className="h-3.5 w-3.5" />Add Partner</button>}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loadingâ€¦</p>
      ) : !data ? (
        <p className="p-6 text-center text-sm text-rose-600">No data</p>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Partners"        value={`${data.totals.active}/${data.totals.affiliates}`} sub="active / total" icon={<Users className="h-4 w-4" />} />
            <Stat label="Total Referrals" value={data.totals.referrals}                              icon={<Gift className="h-4 w-4" />} />
            <Stat label="Pending Payout"  value={`₹${data.totals.pending_payout.toLocaleString("en-IN")}`} tone="amber" icon={<IndianRupee className="h-4 w-4" />} />
            <Stat label="Total Paid"      value={`₹${data.totals.total_paid.toLocaleString("en-IN")}`}     tone="emerald" icon={<IndianRupee className="h-4 w-4" />} />
          </section>

          {/* New form */}
          {showNew && canManage && (
            <section className={`${adminCardCls} p-4`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Add Partner</p>
                <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <form onSubmit={addAffiliate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input className={adminInputCls} placeholder="Name *" value={fName} onChange={(e) => setFName(e.target.value)} required />
                <input className={adminInputCls} placeholder="Email *" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} required />
                <input className={adminInputCls} placeholder="Phone" value={fPhone} onChange={(e) => setFPhone(e.target.value)} />
                <input className={adminInputCls} placeholder="Commission %" type="number" value={fPct} onChange={(e) => setFPct(e.target.value)} />
                <button type="submit" disabled={fSaving} className={`${adminPrimaryBtnCls} lg:col-span-4 justify-center`}>{fSaving ? "Savingâ€¦" : "Create Partner + Referral Link"}</button>
              </form>
            </section>
          )}

          {/* Partners table */}
          <section className={`${adminCardCls} overflow-hidden`}>
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Partners</p>
            </div>
            {data.affiliates.length === 0 ? (
              <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No partners yet. Add your first affiliate!</p>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Partner", "Referral Link", "Commission", "Referrals", "Earned", "Paid", "Status", "Manage"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.affiliates.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-bold">{a.name}</p>
                        <p className={`text-[11px] ${adminMutedCls}`}>{a.email}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <button type="button" onClick={() => copyLink(a.ref_code)} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                          ?ref={a.ref_code}
                          {copied === a.ref_code ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        {canManage ? (
                          <div className="flex items-center gap-1">
                            <input type="number" defaultValue={a.commission_pct} disabled={!canManage}
                              onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v !== a.commission_pct) setCommission(a.id, v); }}
                              className="w-14 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900" />
                            <span className="text-xs font-bold">%</span>
                          </div>
                        ) : <span className="text-xs font-bold">{a.commission_pct}%</span>}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-xs">{a.referrals}</td>
                      <td className="px-4 py-2.5 tabular-nums text-xs font-bold text-emerald-600 dark:text-emerald-300">₹{a.earned.toLocaleString("en-IN")}</td>
                      <td className={`px-4 py-2.5 tabular-nums text-xs ${adminMutedCls}`}>₹{a.paid.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5">
                        {canManage ? (
                          <select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900">
                            <option value="active">active</option>
                            <option value="paused">paused</option>
                            <option value="banned">banned</option>
                          </select>
                        ) : <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{a.status}</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {canManage && (
                          <div className="flex gap-1.5">
                            <button type="button" onClick={() => addReferral(a)} className="rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500">+ Referral</button>
                            <button type="button" onClick={() => removePartner(a.id)} className="rounded-md border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-500/10">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ label, value, sub, icon, tone }: { label: string; value: string | number; sub?: string; icon?: React.ReactNode; tone?: "amber" | "emerald" }) {
  const c = tone === "amber" ? "text-amber-600 dark:text-amber-300" : tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200";
  return (
    <div className={`${adminCardCls} p-4`}>
      <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>{icon}{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${c}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-[11px] ${adminMutedCls}`}>{sub}</p>}
    </div>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking accessâ€¦</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}


