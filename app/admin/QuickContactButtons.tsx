"use client";

// ============================================================
// QuickContactButtons — instant Call / WhatsApp / Email links.
// ============================================================
// Generates standard URI handlers — no API integration required:
//   • Phone  → tel:
//   • WhatsApp → wa.me/<digits>?text=
//   • Email  → mailto:<email>
//
// Used on customer + lead detail pages. Optional message+subject
// props let callers seed the conversation (e.g. "Hi, calling about
// your AgentForge subscription expiring tomorrow").
// ============================================================

import { Mail, MessageCircle, Phone } from "lucide-react";

export type QuickContactProps = {
  phone?: string | null;
  email?: string | null;
  /** Pre-filled WhatsApp message text. URL-encoded automatically. */
  whatsappMessage?: string;
  /** Pre-filled email subject line. */
  emailSubject?: string;
  /** Pre-filled email body. */
  emailBody?: string;
  /** Smaller chips in tight rows. */
  compact?: boolean;
};

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export default function QuickContactButtons({
  phone,
  email,
  whatsappMessage,
  emailSubject,
  emailBody,
  compact,
}: QuickContactProps) {
  const hasPhone = phone && digitsOnly(phone).length >= 8;
  const hasEmail = email && /^[^@]+@[^.]+\..+$/.test(email);

  if (!hasPhone && !hasEmail) {
    return null;
  }

  const padding = compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs";
  const iconSize = compact ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div className="flex flex-wrap gap-1.5">
      {hasPhone && (
        <a
          href={`tel:${digitsOnly(phone!)}`}
          className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${padding}`}
          title={`Call ${phone}`}
        >
          <Phone className={iconSize} />
          Call
        </a>
      )}
      {hasPhone && (
        <a
          href={`https://wa.me/${digitsOnly(phone!)}${
            whatsappMessage
              ? `?text=${encodeURIComponent(whatsappMessage)}`
              : ""
          }`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-600/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25 ${padding}`}
          title={`WhatsApp ${phone}`}
        >
          <MessageCircle className={iconSize} />
          WhatsApp
        </a>
      )}
      {hasEmail && (
        <a
          href={`mailto:${email}${
            emailSubject || emailBody
              ? `?${[
                  emailSubject ? `subject=${encodeURIComponent(emailSubject)}` : "",
                  emailBody ? `body=${encodeURIComponent(emailBody)}` : "",
                ]
                  .filter(Boolean)
                  .join("&")}`
              : ""
          }`}
          className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${padding}`}
          title={`Email ${email}`}
        >
          <Mail className={iconSize} />
          Email
        </a>
      )}
    </div>
  );
}
