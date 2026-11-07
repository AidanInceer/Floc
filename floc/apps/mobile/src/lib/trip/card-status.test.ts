import { describe, expect, it } from "vitest";

import { tripCardStatus } from "./card-status";

const on = "2026-11-07";

describe("the word on a trip card", () => {
  it("says a trip with no dates and nowhere to stay needs you", () => {
    expect(tripCardStatus({ startDate: null, endDate: null, needsYou: true }, on)).toBe("Needs you");
  });

  it("counts down to a trip that has dates", () => {
    expect(tripCardStatus({ startDate: "2026-12-10", endDate: "2026-12-27", needsYou: false }, on)).toBe("In 33 days");
  });

  it("says tomorrow rather than in 1 days", () => {
    expect(tripCardStatus({ startDate: "2026-11-08", endDate: "2026-11-10", needsYou: false }, on)).toBe("Tomorrow");
  });

  it("says a trip under way is happening now", () => {
    expect(tripCardStatus({ startDate: "2026-11-01", endDate: "2026-11-10", needsYou: false }, on)).toBe("Happening now");
  });

  it("says ended once the last day has gone", () => {
    expect(tripCardStatus({ startDate: "2026-10-24", endDate: "2026-10-30", needsYou: false }, on)).toBe("Ended");
  });

  it("calls an undated trip that has a place planning", () => {
    expect(tripCardStatus({ startDate: null, endDate: null, needsYou: false }, on)).toBe("Planning");
  });
});
