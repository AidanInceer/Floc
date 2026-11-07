import { describe, expect, it } from "vitest";

import { TRIP_MARKS, TRIP_MARK_LABELS, readTripMark } from "./trip-mark";

describe("readTripMark (#318: a trip wears a mark, never an image)", () => {
  it("keeps a known mark", () => {
    expect(readTripMark("wave")).toBe("wave");
    expect(readTripMark("lighthouse")).toBe("lighthouse");
    expect(readTripMark("globe")).toBe("globe");
  });

  it("reads a retired mark as the globe, so a trip that wore one keeps a mark", () => {
    for (const retired of ["city", "tent", "umbrella", "sail", "cruise"]) {
      expect(readTripMark(retired)).toBe("globe");
    }
  });

  it("reads anything else as no mark, so the trip shows its pastel alone", () => {
    expect(readTripMark("rocket")).toBeNull();
    expect(readTripMark("")).toBeNull();
    expect(readTripMark(null)).toBeNull();
    expect(readTripMark(undefined)).toBeNull();
    expect(readTripMark(7)).toBeNull();
    expect(readTripMark({ mark: "wave" })).toBeNull();
  });
});

describe("the set", () => {
  it("is fifteen, so the phone picker is three clean rows of five", () => {
    expect(TRIP_MARKS).toHaveLength(15);
  });

  it("labels every mark, because status is never a drawing alone", () => {
    for (const mark of TRIP_MARKS) {
      expect(TRIP_MARK_LABELS[mark]).toBeTruthy();
    }
  });

  it("offers no retired mark", () => {
    for (const retired of ["city", "tent", "umbrella", "sail", "cruise"]) {
      expect(TRIP_MARKS).not.toContain(retired);
    }
  });
});
