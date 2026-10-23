import { isEligible } from "../eligibility";
import { Gender, Component } from "@/types/enums";

test("male whole blood cooldown satisfied", () => {
  const profile = {
    gender: Gender.MALE,
    bloodGroup: "A_POS",
    weightKg: 70,
    lastWholeBlood: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000),
  };
  expect(isEligible(profile, Component.WHOLE_BLOOD)).toBe(true);
});

test("female whole blood cooldown fail", () => {
  const profile = {
    gender: Gender.FEMALE,
    bloodGroup: "A_POS",
    weightKg: 70,
    lastWholeBlood: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
  };
  expect(isEligible(profile, Component.WHOLE_BLOOD)).toBe(false);
});
