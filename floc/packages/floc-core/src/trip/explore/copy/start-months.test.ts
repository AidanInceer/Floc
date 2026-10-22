import { describe, expect, it } from "vitest";

import { copyWindow, startMonths } from "./start-months";

const listing = { nights: 12, bestMonths: "March to May, September to November" };

describe("startMonths", () => {
  it("offers each best month on the 1st of the next one still ahead, soonest first", () => {
    expect(startMonths(listing, "2026-10-22").map((m) => m.startDate)).toEqual([
      "2026-11-01",
      "2027-03-01",
      "2027-04-01",
      "2027-05-01",
      "2027-09-01",
      "2027-10-01",
    ]);
  });

  it("ends the trip after the listing's nights", () => {
    expect(startMonths(listing, "2026-10-22")[0]).toEqual({ month: 11, year: 2026, startDate: "2026-11-01", endDate: "2026-11-13" });
  });

  it("skips a 1st that is today, since the trip would already have started", () => {
    expect(startMonths({ nights: 2, bestMonths: "June" }, "2026-06-01")[0].startDate).toBe("2027-06-01");
  });
});

describe("copyWindow", () => {
  it("dates a best month", () => {
    expect(copyWindow(listing, 4, "2026-10-22")).toEqual({ startDate: "2027-04-01", endDate: "2027-04-13" });
  });

  it("answers null for a month the listing does not name", () => {
    expect(copyWindow(listing, 7, "2026-10-22")).toBeNull();
  });
});
