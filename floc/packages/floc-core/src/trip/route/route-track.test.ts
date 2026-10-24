import { describe, expect, it } from "vitest";

import { acceptPositions, MAX_BATCH, positionAge, underway } from "./route-track";

const trip = { startDate: "2026-09-01", endDate: "2026-09-07" };
const NOW = Date.UTC(2026, 8, 3, 12, 0);
const at = (over: Partial<{ lat: number; lng: number; date: string; recordedAt: number }> = {}) => ({
  lat: 41.9,
  lng: 12.5,
  date: "2026-09-03",
  recordedAt: NOW - 60_000,
  ...over,
});

describe("a trip is under way (#329)", () => {
  it("from its first day to its last, both included", () => {
    expect(underway(trip, "2026-09-01")).toBe(true);
    expect(underway(trip, "2026-09-07")).toBe(true);
  });

  it("not before it starts, nor after it ends", () => {
    expect(underway(trip, "2026-08-31")).toBe(false);
    expect(underway(trip, "2026-09-08")).toBe(false);
  });

  it("never when it has no dates (rule 9)", () => {
    expect(underway({ startDate: null, endDate: null }, "2026-09-03")).toBe(false);
    expect(underway({ startDate: "2026-09-01", endDate: null }, "2026-09-03")).toBe(false);
  });
});

describe("positions a phone sends", () => {
  it("keeps one taken on a day of the trip", () => {
    expect(acceptPositions([at()], trip, NOW)).toEqual([at()]);
  });

  it("drops one taken on a day outside the trip, so nothing records after the end", () => {
    expect(acceptPositions([at({ date: "2026-09-08" }), at({ date: "2026-08-31" })], trip, NOW)).toEqual([]);
  });

  it("drops a position off the globe, a day that is not a date, and a time from the future", () => {
    const bad = [at({ lat: 91 }), at({ lng: -181 }), at({ lat: Number.NaN }), at({ date: "2026-02-31" }), at({ recordedAt: NOW + 3_600_000 })];
    expect(acceptPositions(bad, trip, NOW)).toEqual([]);
  });

  it("takes nothing on an undated trip", () => {
    expect(acceptPositions([at()], { startDate: null, endDate: null }, NOW)).toEqual([]);
  });

  it("takes at most one batch", () => {
    const many = Array.from({ length: MAX_BATCH + 5 }, (_, i) => at({ recordedAt: NOW - i * 1000 }));
    expect(acceptPositions(many, trip, NOW)).toHaveLength(MAX_BATCH);
  });
});

describe("how old a position is, in words", () => {
  const ago = (ms: number) => positionAge(NOW - ms, NOW);

  it("just now under a minute", () => {
    expect(ago(40_000)).toBe("just now");
  });
  it("in minutes under an hour", () => {
    expect(ago(4 * 60_000)).toBe("4 min ago");
  });
  it("in hours under a day", () => {
    expect(ago(3 * 3_600_000 + 1)).toBe("3 h ago");
  });
  it("in days after that", () => {
    expect(ago(26 * 3_600_000)).toBe("1 day ago");
    expect(ago(50 * 3_600_000)).toBe("2 days ago");
  });
  it("just now for a clock a little ahead", () => {
    expect(positionAge(NOW + 5000, NOW)).toBe("just now");
  });
});
