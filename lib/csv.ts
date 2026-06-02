// ============================================================
// Tiny CSV utility — no dependencies, handles quoted commas + CRLF.
// ============================================================
// Good enough for spreadsheet exports from Meta Ads Manager,
// Google Ads, Excel, Numbers, and Google Sheets. Edge cases not
// covered: nested escapes, multi-line quoted fields. If we ever
// need those, swap in papaparse.
// ============================================================

/** Parse a CSV string into { headers, rows }. */
export function parseCsv(text: string): {
  headers: string[];
  rows: string[][];
} {
  // Normalise: strip BOM (Excel adds one), normalise line endings.
  const t = text
    .replace(/^﻿/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = t.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          out.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = parseLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
  );
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

/** Build a CSV string from a row array. Values are auto-quoted. */
export function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const head = headers.map(escape).join(",");
  const body = rows.map((r) => r.map(escape).join(",")).join("\n");
  return head + "\n" + body;
}

/** Trigger a browser download for a CSV string. */
export function downloadCsv(filename: string, csv: string): void {
  // Prepend a BOM so Excel detects UTF-8 properly (rupee symbol etc).
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Pick a value from a parsed row given a list of header candidates.
 * Header strings are normalised (lowercase, alphanumeric only).
 *
 *   const phone = pickField(row, headers, ['phone_number', 'phone', 'mobile']);
 */
export function pickField(
  row: string[],
  headers: string[],
  candidates: string[],
): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  for (const c of candidates.map(norm)) {
    const idx = headers.indexOf(c);
    if (idx !== -1 && row[idx] !== undefined) {
      return row[idx];
    }
  }
  return "";
}
