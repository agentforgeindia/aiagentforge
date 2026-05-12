export const canGenerate = (
  profile: any,
  requiredCredits = 1
) => {

  if (!profile) return false;

  // Unlimited users
  if (profile.is_unlimited) {
    return true;
  }

  // Normal credit check
  return profile.credits >= requiredCredits;
};