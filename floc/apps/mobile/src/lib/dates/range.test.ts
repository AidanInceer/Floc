import { describe, expect, it } from "vitest";

import { nextRange, rangeFrom, rangeLook } from "./range";

describe("a range painted on a calendar", () => {
  it("orders the two ends whichever way the finger went", () => {
    expect(rangeFrom("2027-04-30", "2027-04-22")).toEqual({ start: "2027-04-22", end: "2027-04-30" });
  });

  it("is one day when the finger never moved", () => {
    expect(rangeFrom("2027-04-22", "2027-04-22")).toEqual({ start: "2027-04-22", end: "2027-04-22" });
  });

  it("marks the ends apart from the days between and the days outside", () => {
    const range = { start: "2027-04-22", end: "2027-04-25" };
    expect(rangeLook(range, "2027-04-22")).toBe("end");
    expect(rangeLook(range, "2027-04-23")).toBe("inside");
    expect(rangeLook(range, "2027-04-25")).toBe("end");
    expect(rangeLook(range, "2027-04-26")).toBe("outside");
    expect(rangeLook(null, "2027-04-26")).toBe("outside");
  });
});

describe("choosing a range by taps", () => {
  it("starts a range on the first tap", () => {
    expect(nextRange(null, "2027-04-22", "2027-04-22")).toEqual({ start: "2027-04-22", end: "2027-04-22" });
  });

  it("closes it on the second tap", () => {
    const first = { start: "2027-04-22", end: "2027-04-22" };
    expect(nextRange(first, "2027-05-04", "2027-05-04")).toEqual({ start: "2027-04-22", end: "2027-05-04" });
  });

  it("starts again after a whole range", () => {
    const whole = { start: "2027-04-22", end: "2027-05-04" };
    expect(nextRange(whole, "2027-06-01", "2027-06-01")).toEqual({ start: "2027-06-01", end: "2027-06-01" });
  });

  it("takes a drag as the whole range", () => {
    expect(nextRange(null, "2027-04-22", "2027-04-25")).toEqual({ start: "2027-04-22", end: "2027-04-25" });
  });
});
