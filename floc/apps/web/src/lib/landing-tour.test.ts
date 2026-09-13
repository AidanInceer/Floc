import { describe, expect, it } from "vitest";

import { TOUR_PACE, stepTo, tourAnswerAt, tourBeats, tourLength } from "./landing-tour";

describe("tourBeats", () => {
  it("types each message before it lands, in order", () => {
    const beats = tourBeats(2);
    expect(beats.slice(0, 4)).toEqual([
      { at: TOUR_PACE.lead, kind: "typing", shown: 0 },
      { at: TOUR_PACE.lead + TOUR_PACE.typing, kind: "message", shown: 1 },
      { at: TOUR_PACE.lead + TOUR_PACE.typing + TOUR_PACE.gap, kind: "typing", shown: 1 },
      { at: TOUR_PACE.lead + 2 * TOUR_PACE.typing + TOUR_PACE.gap, kind: "message", shown: 2 },
    ]);
  });

  it("pins the answer after the last message, then moves on after the hold", () => {
    const beats = tourBeats(1);
    const answer = beats.find((b) => b.kind === "answer");
    const next = beats.at(-1);
    expect(answer?.at).toBe(
      TOUR_PACE.lead + TOUR_PACE.typing + TOUR_PACE.gap + TOUR_PACE.beforeAnswer,
    );
    expect(next).toEqual({
      at: TOUR_PACE.lead + TOUR_PACE.typing + TOUR_PACE.gap + TOUR_PACE.hold,
      kind: "next",
      shown: 1,
    });
  });
});

describe("tourLength", () => {
  it("is when the tour moves to the next stop", () => {
    expect(tourLength(3)).toBe(tourBeats(3).at(-1)?.at);
  });
});

describe("tourAnswerAt", () => {
  it("is when the answer pins, so a picked stop's line ends as it lands", () => {
    expect(tourAnswerAt(3)).toBe(tourBeats(3).find((b) => b.kind === "answer")?.at);
  });
});

describe("stepTo", () => {
  it("wraps forward past the last stop", () => {
    expect(stepTo(8, 1, 9)).toBe(0);
  });

  it("wraps back past the first stop", () => {
    expect(stepTo(0, -1, 9)).toBe(8);
  });
});
