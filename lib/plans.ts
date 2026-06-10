export const hasUnlimitedAccess = (plan?: string) => {
  return ["Empire", "Founder", "Unlimited"].includes(plan || "");
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