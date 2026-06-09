"use client";

// Workshop certificate generator.
// User apna naam + date bharte hain, preview dikhta hai, aur original
// certificate template (public/Workshop/certificate-template.png) ke
// upar naam/date overlay karke PDF download ho jaata hai.

import { useEffect, useRef, useState } from "react";

const TEMPLATE_SRC = "/Workshop/certificate-template.png";

// Placement (template ke width/height ke fraction me). Preview dekh ke
// agar thoda upar/neeche/left/right chahiye to ye 4 number tweak kar do.
const NAME_X = 0.515;
const NAME_Y = 0.595;
const DATE_X = 0.805;
const DATE_Y = 0.82;

// Name font ke liye elegant serif Google se load karte hain.
const FONT_FAMILY = '"Playfair Display", Georgia, serif';
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap";
const JSPDF_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function formatDate(value: string): string {
  // value = "yyyy-mm-dd" from <input type="date">
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  if (!y || !m || !d) return "";
  return `${d} ${months[m - 1]} ${y}`;
}

export default function CertificatePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [name, setName] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [imgReady, setImgReady] = useState(false);
  const [fontReady, setFontReady] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const formattedDate = formatDate(dateValue);
  const canDownload = name.trim().length > 0 && formattedDate.length > 0;

  // Load template image once.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgReady(true);
    };
    img.src = TEMPLATE_SRC;
  }, []);

  // Load the certificate font.
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_CSS;
    document.head.appendChild(link);

    const anyDoc = document as any;
    if (anyDoc.fonts?.load) {
      anyDoc.fonts
        .load(`700 80px ${FONT_FAMILY}`)
        .then(() => setFontReady(true))
        .catch(() => setFontReady(true));
    } else {
      setFontReady(true);
    }
  }, []);

  // Re-draw whenever inputs / assets change.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = img.naturalWidth;
    const H = img.naturalHeight;
    canvas.width = W;
    canvas.height = H;

    ctx.drawImage(img, 0, 0, W, H);

    // Name
    const hasName = name.trim().length > 0;
    const displayName = hasName ? name.trim() : "Your Name";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = hasName ? "#312e81" : "rgba(49,46,129,0.35)";
    let fontSize = Math.round(W * 0.043);
    const maxWidth = W * 0.55;
    ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
    while (ctx.measureText(displayName).width > maxWidth && fontSize > 18) {
      fontSize -= 2;
      ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
    }
    ctx.fillText(displayName, W * NAME_X, H * NAME_Y);

    // Date
    const displayDate = formattedDate || "DD Month YYYY";
    ctx.fillStyle = formattedDate ? "#475569" : "rgba(71,85,105,0.35)";
    ctx.font = `600 ${Math.round(W * 0.019)}px Arial, sans-serif`;
    ctx.fillText(displayDate, W * DATE_X, H * DATE_Y);
  }, [name, formattedDate, imgReady, fontReady]);

  const handleDownloadPdf = async () => {
    if (!canDownload || !canvasRef.current) return;
    setDownloading(true);
    try {
      const ok = await loadScript(JSPDF_SRC);
      const jsPDF = ok ? (window as any).jspdf?.jsPDF : null;
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

      if (jsPDF) {
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(dataUrl, "JPEG", 0, 0, canvas.width, canvas.height);
        pdf.save(`AgentForge-Certificate-${name.trim().replace(/\s+/g, "-")}.pdf`);
      } else {
        // CDN block ho gaya to image fallback.
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `AgentForge-Certificate-${name.trim().replace(/\s+/g, "-")}.jpg`;
        a.click();
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-10 text-slate-950">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#22d3ee20,transparent_30%),radial-gradient(circle_at_top_right,#8b5cf620,transparent_35%),linear-gradient(180deg,#f7fbff_0%,#eef8ff_55%,#fffaf5_100%)]" />

      <style jsx global>{`
        body:has(.cert-page) header,
        body:has(.cert-page) footer {
          display: none !important;
        }
      `}</style>

      <section className="cert-page mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-full bg-cyan-50 px-6 py-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-700">
            Workshop Certificate
          </div>
          <h1 className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Download Your Certificate
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
            Apna naam aur completion date bharo — preview neeche update hoga —
            phir PDF download karo.
          </p>
        </div>

        {/* Form */}
        <div className="mx-auto mb-8 grid max-w-2xl gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gurpreet Singh"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Completion Date
            </label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/60 bg-white p-3 shadow-2xl shadow-cyan-100/60">
          <canvas
            ref={canvasRef}
            className="h-auto w-full rounded-[1.5rem]"
          />
        </div>

        {/* Download */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!canDownload || downloading}
            className={`inline-flex items-center justify-center rounded-2xl px-10 py-5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-2xl transition ${
              canDownload && !downloading
                ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 hover:scale-[1.03] active:scale-95"
                : "cursor-not-allowed bg-slate-400"
            }`}
          >
            {downloading
              ? "Generating…"
              : canDownload
                ? "Download Certificate (PDF) →"
                : "Fill name & date to download"}
          </button>
          <p className="mt-4 text-xs font-semibold text-slate-500">
            Certificate AgentForge AI Workshop ke liye hai.
          </p>
        </div>
      </section>
    </main>
  );
}
