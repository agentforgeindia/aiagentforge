"use client";

// ============================================================
// /admin/demo-requests — incoming "Book a Customize Demo" requests.
// Team builds the demo, sends it on WhatsApp, then clicks
// "Mark demo sent" → number flows into the leads pipeline.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, ShieldCheck, ExternalLink, CheckCircle2, Download, Upload, Copy, Check } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type DemoReq = {
  id: string;
  agent: string;
  output_desc: string | null;
  output_size: string | null;
  quality: string | null;
  device: string | null;
  whatsapp: string;
  design_url: string | null;
  logo_url: string | null;
  demo_output_url: string | null;
  client_message: string | null;
  notes: string | null;
  status: string;
  lead_id: string | null;
  created_at: string;
};

// Copy-paste WhatsApp message templates the executive sends with the demo.
const TEMPLATES: { label: string; text: string }[] = [
  {
    label: "Textile Print",
    text:
      "Hi! 👋 Thank you for trying AgentForge.\n\nHere is your *custom textile demo* — your design on a real model, catalogue & WhatsApp ready, made with AI in seconds (no shoot needed). 🧵\n\nYou can generate unlimited model-worn visuals like this for saree, kurti, kurta, lehenga, kidswear & home textile.\n\nWant to create your own catalogue? Reply *YES* and our team will set you up. 🚀",
  },
  {
    label: "Productography",
    text:
      "Hi! 👋 Thank you for trying AgentForge.\n\nHere is your *custom product demo* — an Amazon-ready hero shot of your product, made with AI in seconds (no studio needed). 📸\n\nYou can generate unlimited listing images & ad creatives like this for skincare, perfume, watches, gadgets, food & more — with your label kept exactly intact.\n\nWant to shoot your full catalogue? Reply *YES* and our team will set you up. 🚀",
  },
  {
    label: "Jewellery",
    text:
      "Hi! 👋 Thank you for trying AgentForge.\n\nHere is your *custom jewellery demo* — your piece on a premium model, bridal-campaign quality, made with AI in seconds (no photoshoot needed). 💎\n\nYour exact design, stones & metal tone stay 100% preserved. Generate unlimited visuals for rings, necklaces, earrings, bridal sets & more.\n\nWant to shoot your collection? Reply *YES* and our team will set you up. 🚀",
  },
];

export default function AdminDemoRequestsPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } = useAdminPermissions();
  const canView = has("leads.view");

  const [rows, setRows] = useState<DemoReq[]>([]);
  const [counts, setCounts] = useState<{ total: number; new: number; sent: number } | null>(null);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [promoteId, setPromoteId] = useState<string | null>(null);
  const [pName, setPName] = useState("");
  const [pNotes, setPNotes] = useState("");
  const [pClientMsg, setPClientMsg] = useState("");
  const [pDemoFile, setPDemoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const demoFileRef = useRef<HTMLInputElement | null>(null);

  const token = useMemo(
    () => async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? "";
    },
    [],
  );

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const res = await fetch("/api/admin/demo-requests", {
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const json = await res.json();
      if (json.ok) { setRows(json.requests as DemoReq[]); setCounts(json.counts); }
      setLoadingRows(false);
    })();
  }, [canView, refreshKey, token]);

  const openPromote = (id: string) => {
    setPromoteId(id);
    setPName(""); setPNotes(""); setPClientMsg(""); setPDemoFile(null);
  };

  const copyTemplate = async (text: string, idx: number) => {
    try { await navigator.clipboard.writeText(text); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500); } catch {}
  };

  const downloadUrl = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const obj = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(obj);
    } catch {
      window.open(url, "_blank");
    }
  };

  const uploadDemoOutput = async (file: File): Promise<string> => {
    const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").slice(-40);
    const path = `demo-outputs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await supabase.storage.from("designs").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return supabase.storage.from("designs").getPublicUrl(path).data.publicUrl;
  };

  const promote = async (id: string) => {
    setBusyId(id);
    try {
      let demoUrl = "";
      if (pDemoFile) {
        setUploading(true);
        try { demoUrl = await uploadDemoOutput(pDemoFile); }
        catch { alert("Could not upload the demo image. Please try again."); return; }
        finally { setUploading(false); }
      }
      const res = await fetch("/api/admin/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ id, name: pName, notes: pNotes, client_message: pClientMsg, demo_output_url: demoUrl }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.error || "Could not update."); return; }
      setPromoteId(null);
      setRefreshKey((k) => k + 1);
    } finally {
      setBusyId(null);
    }
  };

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access...
      </main>
    );
  }
  if (!authEmail || !isAdmin || !canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>leads.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  const waLink = (num: string) => `https://wa.me/${num.replace(/\D/g, "")}`;

  return (
    <AdminShell
      doodleType="customers"
      breadcrumbs={[{ label: "Demo Requests" }]}
      title="Customize Demo Requests"
      subtitle="Own section for demo bookings. Build & send the demo, then Promote to Lead — calling team rings the client."
      email={authEmail}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {counts && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black">{counts.total}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>Total requests</p>
          </div>
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black text-amber-600">{counts.new}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>New (pending)</p>
          </div>
          <div className={`${adminCardCls} p-3 text-center`}>
            <p className="text-2xl font-black text-emerald-600">{counts.sent}</p>
            <p className={`text-[11px] ${adminMutedCls}`}>Demo sent</p>
          </div>
        </div>
      )}

      {/* Copy-paste WhatsApp message templates */}
      <div className={`${adminCardCls} mb-4 p-4`}>
        <button type="button" onClick={() => setShowTemplates((v) => !v)} className="flex w-full items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Message templates (copy &amp; send on WhatsApp)
          </span>
          <span className="text-xs font-bold text-cyan-600">{showTemplates ? "Hide" : "Show"}</span>
        </button>
        {showTemplates && (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {TEMPLATES.map((t, i) => (
              <div key={t.label} className="rounded-xl border border-black/10 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-black">{t.label}</span>
                  <button
                    type="button"
                    onClick={() => copyTemplate(t.text, i)}
                    className="inline-flex items-center gap-1 rounded-md bg-cyan-600 px-2 py-1 text-[11px] font-bold text-white"
                  >
                    {copiedIdx === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedIdx === i ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className={`whitespace-pre-line text-[11px] leading-4 ${adminMutedCls}`}>{t.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={adminCardCls}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading...</p>
        ) : rows.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No demo requests yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((r) => (
              <li key={r.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                {/* Client uploads — design + logo, downloadable */}
                <div className="flex shrink-0 gap-2">
                  {r.design_url && (
                    <div className="text-center">
                      <a href={r.design_url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.design_url} alt="design" className="h-28 w-28 rounded-lg border border-black/10 object-cover dark:border-white/10" />
                      </a>
                      <button type="button" onClick={() => downloadUrl(r.design_url!, `design-${r.id}.png`)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-600">
                        <Download className="h-3 w-3" /> Design
                      </button>
                    </div>
                  )}
                  {r.logo_url && (
                    <div className="text-center">
                      <a href={r.logo_url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.logo_url} alt="logo" className="h-28 w-20 rounded-lg border border-black/10 object-contain p-1 dark:border-white/10" />
                      </a>
                      <button type="button" onClick={() => downloadUrl(r.logo_url!, `logo-${r.id}.png`)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-600">
                        <Download className="h-3 w-3" /> Logo
                      </button>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{r.agent}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                      r.status === "new"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    }`}>
                      {r.status === "new" ? "New" : "Demo sent"}
                    </span>
                  </div>
                  {r.output_desc && (
                    <p className="mt-1 text-xs"><span className="font-bold">Wants:</span> <span className={adminMutedCls}>{r.output_desc}</span></p>
                  )}
                  <p className={`mt-1 text-[11px] ${adminMutedCls}`}>
                    {r.device ? `${r.device === "Mobile" ? "📱" : "💻"} ${r.device} · ` : ""}{r.output_size || "—"} · {r.quality || "—"} · {new Date(r.created_at).toLocaleString("en-IN")}
                  </p>
                  <a href={waLink(r.whatsapp)} target="_blank" rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    {r.whatsapp} <ExternalLink className="h-3 w-3" />
                  </a>
                  {/* After demo sent — show what was sent */}
                  {r.status !== "new" && (r.demo_output_url || r.client_message || r.notes) && (
                    <div className="mt-2 rounded-lg border border-emerald-200/60 bg-emerald-50/50 p-2 text-[11px] dark:border-emerald-400/15 dark:bg-emerald-500/5">
                      {r.demo_output_url && (
                        <a href={r.demo_output_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
                          <ExternalLink className="h-3 w-3" /> View sent demo
                        </a>
                      )}
                      {r.client_message && <p className="mt-1"><span className="font-bold">Msg to client:</span> {r.client_message}</p>}
                      {r.notes && <p className="mt-1"><span className="font-bold">For calling team:</span> {r.notes}</p>}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {r.status === "new" ? (
                    <button
                      type="button"
                      onClick={() => (promoteId === r.id ? setPromoteId(null) : openPromote(r.id))}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Promote to Lead
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600">Demo sent → in Leads</span>
                  )}
                </div>
              </div>

              {/* Promote-to-Lead form (executive: demo sent → create lead) */}
              {r.status === "new" && promoteId === r.id && (
                <div className="mt-3 rounded-xl border border-emerald-300/50 bg-emerald-50/60 p-3 dark:border-emerald-400/20 dark:bg-emerald-500/5">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Confirm the demo was sent on WhatsApp, then promote to a lead for the calling team.
                  </p>
                  {/* Upload the demo our team created */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => demoFileRef.current?.click()}
                      className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-emerald-400/50 bg-white px-3 py-2.5 text-left text-sm dark:border-emerald-400/30 dark:bg-slate-900"
                    >
                      {pDemoFile ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={URL.createObjectURL(pDemoFile)} alt="" className="h-12 w-12 rounded-md object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600"><Upload className="h-5 w-5" /></span>
                      )}
                      <span className="min-w-0 flex-1 truncate font-semibold text-slate-700 dark:text-white/80">
                        {pDemoFile ? pDemoFile.name : "Upload the demo you created (image)"}
                      </span>
                    </button>
                    <input ref={demoFileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={(e) => setPDemoFile(e.target.files?.[0] ?? null)} />
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="Client name (optional)"
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-900 dark:text-white"
                    />
                    <input
                      value={r.whatsapp}
                      readOnly
                      className="rounded-lg border border-black/10 bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04]"
                    />
                  </div>

                  {/* Message sent to the client */}
                  <textarea
                    value={pClientMsg}
                    onChange={(e) => setPClientMsg(e.target.value)}
                    rows={2}
                    placeholder="Message you sent to the client on WhatsApp (paste the template you used)…"
                    className="mt-2 w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-900 dark:text-white"
                  />

                  {/* Short detail / instructions for the calling team */}
                  <textarea
                    value={pNotes}
                    onChange={(e) => setPNotes(e.target.value)}
                    rows={2}
                    placeholder="Short detail + instructions for the calling team (what output was made, client interest, follow-up…)"
                    className="mt-2 w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-slate-900 dark:text-white"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setPromoteId(null)} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => promote(r.id)}
                      disabled={busyId === r.id || uploading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {uploading ? "Uploading…" : busyId === r.id ? "Promoting…" : "Demo sent — Promote to Lead"}
                    </button>
                  </div>
                </div>
              )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
