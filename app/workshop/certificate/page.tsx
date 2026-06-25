"use client";

// Workshop certificate generator.
// Candidate enters name + email + picks a workshop date, sees a live
// preview, and downloads the official certificate as a PDF. Each
// download is logged to the backend (name, email, date).

import { useEffect, useRef, useState } from "react";
import { FaWhatsapp, FaInstagram, FaFacebookF, FaLinkedinIn, FaShareAlt } from "react-icons/fa";
import { FiLink, FiCheck } from "react-icons/fi";

// ?v bump karo jab bhi template image replace karo — taaki browser
// purani cached image na dikhaye.
const TEMPLATE_SRC = "/Workshop/certificate-template.png?v=2";

// Placement (as a fraction of the template width/height). Tweak these
// four numbers if the name/date needs nudging on the certificate.
const NAME_X = 0.505;
const NAME_Y = 0.505;
const DATE_X = 0.77;
const DATE_Y = 0.815;

// Fixed workshop dates — candidate can only pick one of these four.
const WORKSHOP_DATES = [
  { value: "2026-06-20", label: "20 June 2026" },
  { value: "2026-06-21", label: "21 June 2026" },
  { value: "2026-06-27", label: "27 June 2026" },
  { value: "2026-06-28", label: "28 June 2026" },
];

// Decorative background doodles.
const DOODLES = [
  { icon: "🧵", left: "6%", top: "14%" },
  { icon: "✂️", left: "16%", top: "70%" },
  { icon: "🪡", left: "30%", top: "22%" },
  { icon: "👕", left: "44%", top: "78%" },
  { icon: "🎓", left: "58%", top: "16%" },
  { icon: "🧶", left: "70%", top: "72%" },
  { icon: "🏆", left: "84%", top: "24%" },
  { icon: "✨", left: "90%", top: "62%" },
  { icon: "🧣", left: "10%", top: "44%" },
  { icon: "📜", left: "78%", top: "46%" },
];

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
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  if (!y || !m || !d) return "";
  return `${d} ${months[m - 1]} ${y}`;
}

// Dates unlock one-by-one. Date 20 (index 0) is always enabled.
// Each next date unlocks once the PREVIOUS workshop date has arrived.
// Returns the highest enabled index (the latest unlocked date).
function computeEnabledIdx(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let maxIdx = 0;
  for (let i = 1; i < WORKSHOP_DATES.length; i++) {
    if (today >= new Date(WORKSHOP_DATES[i - 1].value)) maxIdx = i;
    else break;
  }
  return maxIdx;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// The public workshop landing page — appended to every share so anyone who
// sees the certificate can click through and join the next workshop.
function workshopUrl(): string {
  if (typeof window === "undefined") return "/workshop";
  return `${window.location.origin}/workshop`;
}
// Caption used across every share channel.
function shareMessage(): string {
  return (
    "🎉 I just earned my certificate for the TextilePrints → Mockup AI Workshop by AgentForge!\n\n" +
    "Want to learn AI for textile design too? Join the workshop here 👇\n" +
    workshopUrl()
  );
}

export default function CertificatePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateValue, setDateValue] = useState(WORKSHOP_DATES[0].value);
  const [enabledIdx, setEnabledIdx] = useState(0);
  const [imgReady, setImgReady] = useState(false);
  const [fontReady, setFontReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Backend verification — must confirm the email is a paid registrant
  // for the chosen date before the certificate can be downloaded.
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const formattedDate = formatDate(dateValue);
  const canDownload =
    verified && name.trim().length > 0 && formattedDate.length > 0;

  // Changing the email or date invalidates a previous verification.
  useEffect(() => {
    setVerified(false);
    setVerifyError("");
  }, [email, dateValue]);

  const verifyRegistration = async () => {
    setVerifyError("");
    if (!isValidEmail(email)) {
      setVerifyError("Enter a valid email.");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/workshop/verify-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), date: dateValue }),
      });
      const data = await res.json();
      if (data?.verified) {
        setVerified(true);
        // Use the registered name on record if the field is still empty.
        if (data.name && !name.trim()) setName(String(data.name));
      } else {
        setVerified(false);
        setVerifyError(data?.error || "Could not verify this registration.");
      }
    } catch {
      setVerified(false);
      setVerifyError("Could not verify right now. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  // Unlock dates based on today, and select the latest unlocked one.
  useEffect(() => {
    const idx = computeEnabledIdx();
    setEnabledIdx(idx);
    setDateValue(WORKSHOP_DATES[idx].value);
  }, []);

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
    let fontSize = Math.round(W * 0.034);
    const maxWidth = W * 0.5;
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

  const handleDownload = async () => {
    if (!canDownload || !canvasRef.current) return;
    setDownloading(true);
    try {
      // Log the download to the backend (best-effort).
      try {
        await fetch("/api/workshop/certificate-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            date: formattedDate,
          }),
        });
      } catch {
        /* never block the download over logging */
      }

      const ok = await loadScript(JSPDF_SRC);
      const jsPDF = ok ? (window as any).jspdf?.jsPDF : null;
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const fileBase = `AgentForge-Certificate-${name.trim().replace(/\s+/g, "-")}`;

      if (jsPDF) {
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(dataUrl, "JPEG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileBase}.pdf`);
      } else {
        // Fallback if the CDN is blocked.
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${fileBase}.jpg`;
        a.click();
      }
    } finally {
      setDownloading(false);
    }
  };

  // ── Share ────────────────────────────────────────────────────────────
  const openShare = (url: string) =>
    window.open(url, "_blank", "noopener,noreferrer,width=620,height=560");

  // Build the rendered certificate as an image File (for native sharing).
  const buildCertFile = async (): Promise<File | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.95),
    );
    if (!blob) return null;
    const safe = (name.trim() || "Workshop").replace(/\s+/g, "-");
    return new File([blob], `AgentForge-Certificate-${safe}.jpg`, { type: "image/jpeg" });
  };

  // Desktop fallback: download the certificate so the user can attach it.
  const downloadCertImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/jpeg", 0.95);
    a.download = "AgentForge-Certificate.jpg";
    a.click();
  };

  // Share WITH the certificate image. Mobile/supported → OS share sheet with
  // the image attached (so it actually reaches WhatsApp/IG/etc). Desktop →
  // download the certificate + open the platform and tell the user to attach
  // it (web share intents like wa.me cannot carry an image file).
  const shareWithCert = async (platformUrl: string) => {
    const msg = shareMessage();
    const file = await buildCertFile();
    if (file && typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: msg, url: workshopUrl() });
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    // Desktop fallback — give them the image + open the platform.
    downloadCertImage();
    alert(
      "Your certificate has been downloaded 📥\nAttach it in the share window that opens.",
    );
    if (platformUrl) openShare(platformUrl);
  };

  const shareWhatsApp = () =>
    shareWithCert(`https://wa.me/?text=${encodeURIComponent(shareMessage())}`);

  const shareFacebook = () =>
    shareWithCert(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        workshopUrl(),
      )}&quote=${encodeURIComponent(shareMessage())}`,
    );

  const shareLinkedIn = () =>
    shareWithCert(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        workshopUrl(),
      )}`,
    );

  // Instagram has no web "share a link" intent — native sheet (with image)
  // on mobile, else download the cert + open Instagram.
  const shareInstagram = () => shareWithCert("https://www.instagram.com/");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  // Primary "Share Now" — OS share sheet with the certificate image attached.
  // Desktop fallback: download the certificate + copy the caption.
  const shareNow = async () => {
    const msg = shareMessage();
    const file = await buildCertFile();
    if (file && typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: msg, url: workshopUrl() });
      } catch {
        /* user dismissed */
      }
      return;
    }
    downloadCertImage();
    await copyLink();
    alert(
      "Certificate downloaded 📥 and caption copied — paste & attach it in your post/status.",
    );
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-10 text-slate-950">
      {/* Background + doodles */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee20,transparent_30%),radial-gradient(circle_at_top_right,#8b5cf620,transparent_35%),radial-gradient(circle_at_bottom,#f59e0b15,transparent_30%),linear-gradient(180deg,#f7fbff_0%,#eef8ff_55%,#fffaf5_100%)]" />
        {DOODLES.map((d, i) => (
          <div
            key={i}
            className="absolute rounded-[1.6rem] bg-white/70 p-3 text-3xl shadow-xl backdrop-blur-md"
            style={{
              left: d.left,
              top: d.top,
              animation: `floatDoodle ${10 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          >
            {d.icon}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes floatDoodle {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(22px, -18px) rotate(5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        body:has(.cert-page) header,
        body:has(.cert-page) footer {
          display: none !important;
        }
      `}</style>

      <section className="cert-page relative z-10 mx-auto max-w-5xl">
        {/* Review CTA — attendees here loved the workshop; ask for a review. */}
        <a
          href="/workshop/review"
          className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-5 py-3.5 shadow-sm transition hover:shadow-md"
        >
          <span className="text-sm font-bold text-violet-800">
            ⭐ Loved the workshop? Leave a quick review &amp; help other businesses.
          </span>
          <span className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
            Write a review →
          </span>
        </a>

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-full bg-cyan-50 px-6 py-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-700">
            🎉 Congratulations
          </div>
          <h1 className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Claim Your Certificate
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
            Well done! You&apos;ve successfully completed the{" "}
            <span className="font-bold text-violet-600">
              TextilePrints to Mockup AI Workshop
            </span>
            . Enter your details, pick your workshop date, and download your
            official certificate.
          </p>
        </div>

        {/* Form */}
        <div className="mx-auto mb-8 grid max-w-3xl gap-4 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl sm:grid-cols-3">
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Workshop Date
            </label>
            <select
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
            >
              {WORKSHOP_DATES.map((d, i) => (
                <option key={d.value} value={d.value} disabled={i > enabledIdx}>
                  {d.label}
                  {i > enabledIdx ? " 🔒 (locked)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Verify registration — required before download */}
        <div className="mx-auto mt-6 max-w-md text-center">
          <button
            type="button"
            onClick={verifyRegistration}
            disabled={verifying || verified}
            className={`inline-flex w-full items-center justify-center rounded-2xl px-8 py-3.5 text-sm font-black uppercase tracking-[0.12em] transition ${
              verified
                ? "cursor-default bg-emerald-100 text-emerald-700"
                : "bg-slate-900 text-white hover:scale-[1.02] active:scale-95"
            } ${verifying ? "opacity-70" : ""}`}
          >
            {verifying
              ? "Verifying…"
              : verified
                ? "✓ Registration verified"
                : "Verify my registration"}
          </button>
          {verifyError && (
            <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
              {verifyError}
            </p>
          )}
          {!verified && !verifyError && (
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Enter the email you registered / paid with, pick your date, then verify.
            </p>
          )}
        </div>

        {/* Preview */}
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/60 bg-white p-3 shadow-2xl shadow-cyan-100/60">
          <canvas ref={canvasRef} className="h-auto w-full rounded-[1.5rem]" />
        </div>

        {/* Download */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleDownload}
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
                : verified
                  ? "Enter your name to download"
                  : "Verify your registration first"}
          </button>
          <p className="mt-4 text-xs font-semibold text-slate-500">
            Your certificate is for the AgentForge AI Workshop.
          </p>
        </div>

        {/* Share — appears once the certificate can be claimed. Every share
            carries the workshop link so viewers can join the next batch. */}
        {canDownload && (
          <div className="mx-auto mt-8 max-w-2xl rounded-[2rem] border border-white/60 bg-white/80 p-6 text-center shadow-xl backdrop-blur-xl">
            <h2 className="text-lg font-black tracking-tight text-slate-800 sm:text-xl">
              Share your achievement 🎉
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-5 text-slate-500">
              Show off your certificate — your friends can tap the workshop link
              and join the next batch.
            </p>

            <button
              type="button"
              onClick={shareNow}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 px-8 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-xl transition hover:scale-[1.03] active:scale-95"
            >
              <FaShareAlt className="h-4 w-4" />
              Share Now
            </button>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={shareWhatsApp}
                aria-label="Share on WhatsApp"
                title="WhatsApp"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 active:scale-95"
              >
                <FaWhatsapp className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={shareInstagram}
                aria-label="Share on Instagram"
                title="Instagram"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white shadow-lg transition hover:scale-110 active:scale-95"
              >
                <FaInstagram className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={shareFacebook}
                aria-label="Share on Facebook"
                title="Facebook"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg transition hover:scale-110 active:scale-95"
              >
                <FaFacebookF className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={shareLinkedIn}
                aria-label="Share on LinkedIn"
                title="LinkedIn"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-lg transition hover:scale-110 active:scale-95"
              >
                <FaLinkedinIn className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={copyLink}
                aria-label="Copy workshop link"
                title="Copy link"
                className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-110 active:scale-95 ${
                  copied ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                {copied ? <FiCheck className="h-5 w-5" /> : <FiLink className="h-5 w-5" />}
              </button>
            </div>

            {copied && (
              <p className="mt-3 text-xs font-bold text-emerald-600">
                Link copied — paste it anywhere!
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
