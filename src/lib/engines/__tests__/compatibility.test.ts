import { prioritizedGroups } from "../compatibility";
import { BloodGroup } from "@/types/enums";

test("EXACT_OR_SDP prioritization includes exact first and O_NEG fallback", () => {
  const order = prioritizedGroups(BloodGroup.A_POS, "EXACT_OR_SDP");
  expect(order[0]).toBe("A_POS");
  expect(order).toContain("O_NEG");
});

test("REPLACEMENT_ANY returns all groups", () => {
  const order = prioritizedGroups(BloodGroup.B_POS, "REPLACEMENT_ANY");
  expect(order.length).toBe(Object.values(BloodGroup).length);
});
