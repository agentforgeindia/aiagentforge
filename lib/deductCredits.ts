export const shouldDeductCredits = (
  profile: any
) => {

  if (!profile) return false;

  if (profile.is_unlimited) {
    return false;
  }

  return true;
};