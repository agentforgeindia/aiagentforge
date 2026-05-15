export const hasUnlimitedAccess = (plan?: string) => {
  return ["Empire", "Founder", "Unlimited"].includes(plan || "");
};

export const hasBulkAccess = (plan?: string) => {
  return ["Empire", "Founder", "Unlimited"].includes(plan || "");
};