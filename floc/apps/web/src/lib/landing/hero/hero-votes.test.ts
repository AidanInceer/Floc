import { describe, expect, it } from "vitest";

import { heroVotes, leader, tally, voteHeadline } from "./hero-votes";

describe("tally", () => {
  it("counts nothing before the first vote", () => {
    expect(tally(0)).toEqual({ Lisbon: 0, Sicily: 0, Croatia: 0 });
  });

  it("counts every vote once all six are in", () => {
    expect(tally(heroVotes.length)).toEqual({ Lisbon: 2, Sicily: 3, Croatia: 1 });
  });
});

describe("leader", () => {
  it("is Lisbon early on", () => {
    expect(leader(tally(2))).toBe("Lisbon");
  });

  it("is nobody while two places are level", () => {
    expect(leader(tally(5))).toBeNull();
  });

  it("is Sicily once the last vote lands", () => {
    expect(leader(tally(6))).toBe("Sicily");
  });
});

describe("voteHeadline", () => {
  it("tells the story vote by vote: Lisbon out in front, level, then Sicily", () => {
    expect(heroVotes.map((_, i) => voteHeadline(i + 1))).toEqual([
      "Lisbon leads",
      "Lisbon leads",
      "Lisbon leads",
      "Lisbon leads",
      "Tied",
      "All 6 · Sicily",
    ]);
  });

  it("says how many have voted before anyone has", () => {
    expect(voteHeadline(0)).toBe("0 of 6 voted");
  });
});
