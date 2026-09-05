import { describe, expect, it } from "vitest";

import type { VoteValue } from "./vocabulary";

import { voteScore } from "./votes";

const votes = (...values: VoteValue[]) => values.map((value) => ({ value }));

/**
 * Ticket 36 follow-up: the board's "Most liked" order has three tiers now, so a
 * thumbs-up has to count for something. The old score was keen-minus-rather-not
 * and threw the middle tier away.
 */
describe("voteScore", () => {
  it("keeps the three tiers in order", () => {
    expect(voteScore(votes("up"))).toBeGreaterThan(voteScore(votes("dont_mind")));
    expect(voteScore(votes("dont_mind"))).toBeGreaterThan(voteScore(votes("down")));
  });

  it("counts a thumbs-up, which the old two-tier score ignored", () => {
    expect(voteScore(votes("dont_mind", "dont_mind", "dont_mind"))).toBeGreaterThan(
      voteScore([]),
    );
  });

  it("ranks a loved idea above one everyone is merely fine with", () => {
    expect(voteScore(votes("up", "up"))).toBeGreaterThan(
      voteScore(votes("dont_mind", "dont_mind", "dont_mind")),
    );
  });

  it("treats an objection as weighty as enthusiasm — a split group scores nothing", () => {
    expect(voteScore(votes("up", "down"))).toBe(0);
    expect(voteScore(votes("dont_mind", "dont_mind", "down"))).toBe(0);
  });

  it("adds up, so group-wide support beats one person's love", () => {
    expect(voteScore(votes("dont_mind", "dont_mind", "dont_mind"))).toBeGreaterThan(
      voteScore(votes("up")),
    );
  });

  it("scores an idea nobody has voted on at zero, not below", () => {
    expect(voteScore([])).toBe(0);
  });
});
