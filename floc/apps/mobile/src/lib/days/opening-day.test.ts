import { describe, expect, it } from "vitest";

import { openingDay } from "./opening-day";

const dates = ["2026-10-21", "2026-10-22", "2026-10-26"];

describe("openingDay", () => {
  it("opens the day that was asked for", () => {
    expect(openingDay(dates, "2026-10-26", "2026-10-22")).toBe("2026-10-26");
  });

  it("opens today when nothing was asked for and the trip is running", () => {
    expect(openingDay(dates, undefined, "2026-10-22")).toBe("2026-10-22");
  });

  it("opens the first day when the asked day is not on the trip", () => {
    expect(openingDay(dates, "2027-01-01", "2026-09-16")).toBe("2026-10-21");
  });
});
