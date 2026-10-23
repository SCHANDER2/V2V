import { Gender, Component, BloodGroup } from "@/types/enums";

// Helper to calculate difference in days without external library
function diffInDays(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcA - utcB) / msPerDay);
}

export interface DonorProfile {
  gender: Gender | string;
  bloodGroup: BloodGroup | string;
  lastWholeBlood?: Date | null;
  lastPlatelet?: Date | null;
  lastPRBC?: Date | null;
  weightKg: number;
}

/**
 * NBTC eligibility evaluator.
 * Returns true if donor satisfies age/weight and component-specific cooldowns.
 */
export function isEligible(profile: DonorProfile, component: Component | string): boolean {
  // Weight thresholds
  if (component === "SDP" && profile.weightKg < 50) return false;
  if (component !== "SDP" && profile.weightKg < 45) return false;

  const now = new Date();

  switch (component) {
    case "WHOLE_BLOOD":
    case "PRBC": {
      if (!profile.lastWholeBlood) return true;
      const days = diffInDays(now, new Date(profile.lastWholeBlood));
      const isMale = profile.gender === "MALE" || profile.gender === Gender.MALE;
      return isMale ? days >= 90 : days >= 120;
    }
    case "SDP": {
      if (profile.lastPlatelet) {
        const hrs = (now.getTime() - new Date(profile.lastPlatelet).getTime()) / (1000 * 60 * 60);
        if (hrs < 48) return false;
      }
      if (!profile.lastWholeBlood) return true;
      const days = diffInDays(now, new Date(profile.lastWholeBlood));
      return days >= 28;
    }
    default:
      return true;
  }
}
