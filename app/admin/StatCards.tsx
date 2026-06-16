// Shared gradient KPI card — used by the CRM dashboard and the War Room
// so the whole admin shares one polished stat-card language.

export function GradientStat({
  label,
  value,
  sub,
  gradient,
}: {
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-xl p-4 text-white shadow-sm ${gradient}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tabular-nums leading-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] font-medium text-white/70">{sub}</p>}
    </div>
  );
}

// Compact INR — ₹2.34Cr / ₹1.20L / ₹12.5K
export function inrCompact(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
