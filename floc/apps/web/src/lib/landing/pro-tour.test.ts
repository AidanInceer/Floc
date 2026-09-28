import { describe, expect, it } from "vitest";

import { PRO_FEATURES, PRO_STAGES, nextStage } from "./pro-tour";

describe("nextStage", () => {
  it("moves on one stage at a time", () => {
    expect(nextStage(0, 4)).toBe(1);
  });

  it("rests on the last stage rather than looping", () => {
    expect(nextStage(3, 4)).toBeNull();
  });
});

describe("the Pro tour", () => {
  it("walks the trip from deciding to home again", () => {
    expect(PRO_STAGES.map((s) => s.name)).toEqual(["Deciding", "Booking", "Away", "Home again"]);
  });

  it("shows every feature once across the trip", () => {
    const shown = PRO_STAGES.flatMap((s) => s.keys);
    expect(shown.length).toBe(new Set(shown).size);
    expect([...shown].sort()).toEqual(Object.keys(PRO_FEATURES).sort());
  });

  it("leaves the travel agent to its own band", () => {
    expect(Object.keys(PRO_FEATURES)).not.toContain("agent");
  });
});
