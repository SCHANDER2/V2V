// Compatibility matrix using enum values
import { BloodGroup } from "@/types/enums";

const compatibilityMatrix: Record<BloodGroup, BloodGroup[]> = {
  [BloodGroup.A_POS]: [BloodGroup.A_POS, BloodGroup.A_NEG, BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.A_NEG]: [BloodGroup.A_NEG, BloodGroup.O_NEG],
  [BloodGroup.B_POS]: [BloodGroup.B_POS, BloodGroup.B_NEG, BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.B_NEG]: [BloodGroup.B_NEG, BloodGroup.O_NEG],
  [BloodGroup.AB_POS]: [BloodGroup.A_POS, BloodGroup.A_NEG, BloodGroup.B_POS, BloodGroup.B_NEG, BloodGroup.AB_POS, BloodGroup.AB_NEG, BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.AB_NEG]: [BloodGroup.A_NEG, BloodGroup.B_NEG, BloodGroup.AB_NEG, BloodGroup.O_NEG],
  [BloodGroup.O_POS]: [BloodGroup.O_POS, BloodGroup.O_NEG],
  [BloodGroup.O_NEG]: [BloodGroup.O_NEG],
  [BloodGroup.BOMBAY_OH]: [BloodGroup.BOMBAY_OH],
};

/**
 * Returns prioritized donor blood groups based on request mode.
 * - REPLACEMENT_ANY: returns all groups (order not important).
 * - EXACT_OR_SDP: exact match first, then compatible, then O_NEG fallback.
 */
export function prioritizedGroups(
  requestGroup: BloodGroup,
  mode: "REPLACEMENT_ANY" | "EXACT_OR_SDP"
): BloodGroup[] {
  if (mode === "REPLACEMENT_ANY") {
    // Return all blood groups
    return Object.values(BloodGroup);
  }
  const exact = [requestGroup];
  const compatible = (compatibilityMatrix[requestGroup] || []).filter((g) => g !== requestGroup);
  const fallback =
    requestGroup !== BloodGroup.O_NEG && requestGroup !== BloodGroup.BOMBAY_OH
      ? [BloodGroup.O_NEG]
      : [];
  return Array.from(new Set([...exact, ...compatible, ...fallback]));
}
