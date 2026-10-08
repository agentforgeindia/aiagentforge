// Empire is a 36,000-credit plan, NOT unlimited (decision 2026-10-08).
// Only the internal Founder / Unlimited plans skip credit deduction.
export const hasUnlimitedAccess = (plan?: string) => {
  return ["Founder", "Unlimited"].includes(plan || "");
};

export const hasBulkAccess = (plan?: string) => {
  const p = (plan || "").toLowerCase();
  return (
    p.includes("empire") ||
    p.includes("founder") ||
    p.includes("unlimited") ||
    p.includes("pro") ||
    p.includes("creator")
  );
};