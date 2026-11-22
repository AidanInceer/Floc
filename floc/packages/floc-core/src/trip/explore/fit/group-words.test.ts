import { describe, expect, it } from "vitest";

import { groupIdeasNote } from "./group-words";

describe("the line above a group's trip ideas (#177)", () => {
  it("says nothing when every member has a travel style", () => {
    expect(groupIdeasNote({ people: 3, withStyle: 3, you: true })).toBeNull();
  });

  it("counts the members with no travel style, never naming them", () => {
    expect(groupIdeasNote({ people: 5, withStyle: 3, you: true })).toBe(
      "Based on you and 3 of 5 people. 2 have no travel style yet, so these may fit them less well.",
    );
  });

  it("speaks of one person in the singular", () => {
    expect(groupIdeasNote({ people: 1, withStyle: 0, you: true })).toBe(
      "Based on you and 0 of 1 person. 1 has no travel style yet, so these may fit them less well.",
    );
  });

  it("leaves the owner out when they have no travel style", () => {
    expect(groupIdeasNote({ people: 4, withStyle: 3, you: false })).toBe(
      "Based on 3 of 4 people. 1 has no travel style yet, so these may fit them less well.",
    );
  });
});
