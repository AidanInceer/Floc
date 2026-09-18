import { describe, expect, it } from "vitest";

import { TRIP_MARKS, TRIP_MARK_LABELS, readTripMark } from "./trip-mark";

describe("readTripMark (#318: a trip wears a mark, never an image)", () => {
  it("keeps a known mark", () => {
    expect(readTripMark("wave")).toBe("wave");
    expect(readTripMark("cruise")).toBe("cruise");
  });

  it("reads anything else as no mark, so a dropped mark degrades to the pastel", () => {
    expect(readTripMark("lighthouse")).toBeNull();
    expect(readTripMark("")).toBeNull();
    expect(readTripMark(null)).toBeNull();
    expect(readTripMark(undefined)).toBeNull();
    expect(readTripMark(7)).toBeNull();
    expect(readTripMark({ mark: "wave" })).toBeNull();
  });
});

describe("the set", () => {
  it("is ten, so the phone picker is two clean rows of five", () => {
    expect(TRIP_MARKS).toHaveLength(10);
  });

  it("labels every mark, because status is never a drawing alone", () => {
    for (const mark of TRIP_MARKS) {
      expect(TRIP_MARK_LABELS[mark]).toBeTruthy();
    }
  });

  it("names places and holiday types, not objects a person carries", () => {
    expect(TRIP_MARKS).toContain("house");
    expect(TRIP_MARKS).toContain("tent");
    expect(TRIP_MARKS).toContain("city");
  });
});
