"use client";

// ============================================================
// LeadsCsvImportModal — bulk upload past leads from Meta Ads
// Manager, Google Ads, or any spreadsheet.
// ============================================================
// Accepts the standard CSV exports each ad platform produces.
// Auto-detects common header names; user can override the
// channel + status defaults that get applied to every row.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { parseCsv, pickField } from "@/lib/csv";

const SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook",  label: "Facebook" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "google",    label: "Google" },
  { value: "call",      label: "Phone" },
  { value: "referral",  label: "Referral" },
  { value: "website",   label: "Website" },
  { value: "event",     label: "Event" },
  { value: "other",     label: "Other" },
];

const STATUSES = [
  { value: "new",       label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "demo",      label: "Demo" },
  { value: "trial",     label: "Trial" },
  { value: "converted", label: "Converted" },
  { value: "lost",      label: "Lost" },
];

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const labelCls =
  "mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

type Parsed = {
  headers: string[];
  rows: string[][];
  preview: { name: string; phone: string; email: string; city: string }[];
};

export default function LeadsCsvImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [defaultSource, setDefaultSource] = useState("facebook");
  const [defaultStatus, setDefaultStatus] = useState("new");
  const [campaignTag, setCampaignTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
    errors: number;
  } | null>(null);

  // Reset whenever the modal re-opens.
  useEffect(() => {
    if (open) {
      setFilename("");
      setParsed(null);
      setError(null);
      setDefaultSource("facebook");
      setDefaultStatus("new");
      setCampaignTag("");
      setResult(null);
    }
  }, [open]);

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setFilename(file.name);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("File must be a .csv");
      return;
    }
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    if (headers.length === 0 || rows.length === 0) {
      setError("CSV is empty or unreadable.");
      return;
    }

    const preview = rows.slice(0, 5).map((r) => ({
      name:
        pickField(r, headers, [
          "full_name", "name", "first_name",
        ]) || "(no name)",
      phone: pickField(r, headers, [
        "phone_number", "phone", "mobile", "mobile_number", "contact_number",
      ]),
      email: pickField(r, headers, ["email", "email_address"]),
      city: pickField(r, headers, ["city", "town", "location"]),
    }));

    setParsed({ headers, rows, preview });
  }

  async function importAll() {
    if (!parsed) return;
    setSubmitting(true);
    setError(null);

    const { headers, rows } = parsed;
    const detail = campaignTag.trim() || `csv:${filename}`;

    // Build payloads with auto-mapping.
    const payloads = rows
      .map((r) => {
        const name =
          pickField(r, headers, ["full_name", "name"]) ||
          [
            pickField(r, headers, ["first_name"]),
            pickField(r, headers, ["last_name"]),
          ]
            .filter(Boolean)
            .join(" ") ||
          "(no name)";
        const phone =
          pickField(r, headers, [
            "phone_number", "phone", "mobile", "mobile_number", "contact_number",
          ]) || null;
        const email = pickField(r, headers, ["email", "email_address"]) || null;
        const business =
          pickField(r, headers, [
            "company_name", "business", "business_name", "company",
          ]) || null;
        const city = pickField(r, headers, ["city", "town", "location"]) || null;
        const notes =
          pickField(r, headers, ["notes", "message", "comments"]) || null;
        const externalId =
          pickField(r, headers, [
            "lead_id", "external_id", "id", "leadgen_id",
          ]) || null;

        // Skip rows with nothing useful.
        if (!name && !phone && !email) return null;

        return {
          name: name.slice(0, 200),
          phone: phone?.slice(0, 50) ?? null,
          email: email?.slice(0, 200) ?? null,
          business_name: business?.slice(0, 200) ?? null,
          city: city?.slice(0, 100) ?? null,
          source: defaultSource,
          source_detail: detail,
          status: defaultStatus,
          notes,
          external_lead_id: externalId,
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (payloads.length === 0) {
      setError("No usable rows found (each row needs at least a name, phone or email).");
      setSubmitting(false);
      return;
    }

    // Batch insert in chunks of 100 to keep payload size sane.
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    const CHUNK = 100;
    for (let i = 0; i < payloads.length; i += CHUNK) {
      const slice = payloads.slice(i, i + CHUNK);
      const { error: insErr, count } = await supabase
        .from("leads")
        .insert(slice, { count: "exact" });
      if (insErr) {
        // Unique constraint on external_lead_id → fall back to row-by-row
        // to count which actually inserted vs duplicate.
        if (
          insErr.code === "23505" ||
          insErr.message?.toLowerCase().includes("duplicate")
        ) {
          for (const row of slice) {
            const { error: singleErr } = await supabase
              .from("leads")
              .insert(row);
            if (!singleErr) inserted++;
            else if (
              singleErr.code === "23505" ||
              singleErr.message?.toLowerCase().includes("duplicate")
            )
              skipped++;
            else errors++;
          }
        } else {
          console.error("[csv import] batch error:", insErr.message);
          errors += slice.length;
        }
      } else {
        inserted += count ?? slice.length;
      }
    }

    setSubmitting(false);
    setResult({ inserted, skipped, errors });
    if (inserted > 0) onImported(inserted);
  }

  const summary = useMemo(() => {
    if (!parsed) return null;
    return `${parsed.rows.length} row${parsed.rows.length === 1 ? "" : "s"} detected · ${parsed.headers.length} columns`;
  }, [parsed]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 px-2 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-[#0f1218]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-[#0f1218]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Bulk import
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">
              Import leads from a CSV
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* Help */}
          <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
            Export the leads from Meta Ads Manager (Ad → Lead Form → Download
            CSV) or Google Ads (Lead form → Download). Drop the file here.
            We auto-detect <code>name</code>, <code>email</code>,{" "}
            <code>phone</code>, <code>city</code>, <code>company</code>,{" "}
            <code>notes</code> columns.
          </p>

          {/* File picker */}
          <div className="mt-4">
            <label
              htmlFor="csv-file"
              className="block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-indigo-500"
            >
              <Upload className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-2 text-sm font-bold">
                {filename || "Click to choose a CSV file"}
              </p>
              <p className={`mt-0.5 text-[11px] text-slate-500`}>
                {summary ?? "Max 10,000 rows recommended"}
              </p>
              <input
                ref={fileRef}
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
          </div>

          {/* Defaults */}
          {parsed && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={labelCls}>Apply source</span>
                <select
                  value={defaultSource}
                  onChange={(e) => setDefaultSource(e.target.value)}
                  className={inputCls}
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Apply status</span>
                <select
                  value={defaultStatus}
                  onChange={(e) => setDefaultStatus(e.target.value)}
                  className={inputCls}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Tag (source detail)</span>
                <input
                  type="text"
                  value={campaignTag}
                  onChange={(e) => setCampaignTag(e.target.value)}
                  placeholder={`csv:${filename || "import"}`}
                  className={inputCls}
                />
              </label>
            </div>
          )}

          {/* Preview */}
          {parsed && (
            <div className="mt-4">
              <p className={labelCls}>Preview (first 5)</p>
              <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-bold uppercase tracking-[0.12em] text-slate-500">
                        Name
                      </th>
                      <th className="px-3 py-1.5 text-left font-bold uppercase tracking-[0.12em] text-slate-500">
                        Phone
                      </th>
                      <th className="px-3 py-1.5 text-left font-bold uppercase tracking-[0.12em] text-slate-500">
                        Email
                      </th>
                      <th className="px-3 py-1.5 text-left font-bold uppercase tracking-[0.12em] text-slate-500">
                        City
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {parsed.preview.map((p, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5">{p.name}</td>
                        <td className="px-3 py-1.5">{p.phone || "—"}</td>
                        <td className="px-3 py-1.5">{p.email || "—"}</td>
                        <td className="px-3 py-1.5">{p.city || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              <p className="font-bold">Done.</p>
              <p className="mt-1">
                Inserted: <b>{result.inserted}</b> · Skipped (duplicates):{" "}
                <b>{result.skipped}</b> · Errors: <b>{result.errors}</b>
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-[#0f1218]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {result ? "Close" : "Cancel"}
          </button>
          {parsed && !result && (
            <button
              type="button"
              onClick={importAll}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {submitting
                ? "Importing…"
                : `Import ${parsed.rows.length} leads`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
