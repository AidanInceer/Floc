/**
 * The window-versus-days rule (ticket 140). These are the cases the grilling
 * session actually argued about, so they are written as the scenarios rather
 * than as coverage of the branches.
 */
import { describe, expect, it } from "vitest";

import { MAX_TRIP_DAYS, windowCost, windowCostLabel, windowCostNoun, windowProblem } from "./trip-window";

/** 1–7 Sep, with events only on the 6th and 7th. */
const week = [
  { date: "2026-09-01", events: 0 },
  { date: "2026-09-02", events: 0 },
  { date: "2026-09-03", events: 0 },
  { date: "2026-09-04", events: 0 },
  { date: "2026-09-05", events: 0 },
  { date: "2026-09-06", events: 2 },
  { date: "2026-09-07", events: 3 },
];

describe("windowCost", () => {
  it("costs nothing when the window only grows", () => {
    expect(windowCost(week, "2026-08-30", "2026-09-09")).toEqual({
      days: 0,
      events: 0,
    });
  });

  it("costs nothing when the window is unchanged", () => {
    expect(windowCost(week, "2026-09-01", "2026-09-07")).toEqual({
      days: 0,
      events: 0,
    });
  });

  it("counts only the days outside the new window", () => {
    // 1–7 → 3–9: the 1st and 2nd go, the 8th and 9th arrive blank.
    expect(windowCost(week, "2026-09-03", "2026-09-09")).toEqual({
      days: 2,
      events: 0,
    });
  });

  it("counts the events on the days it removes", () => {
    // A shrink off the end takes the two days that hold everything.
    expect(windowCost(week, "2026-09-01", "2026-09-05")).toEqual({
      days: 2,
      events: 5,
    });
  });

  it("costs the whole itinerary when the windows share no date", () => {
    // The accepted consequence of addressing a day by its date and not by its
    // position: a window that moves clear of the old one keeps nothing.
    expect(windowCost(week, "2026-09-08", "2026-09-14")).toEqual({
      days: 7,
      events: 5,
    });
  });

  it("costs the whole itinerary when the window is emptied", () => {
    // "Reset dates" — an empty window is not a special case here.
    expect(windowCost(week, null, null)).toEqual({ days: 7, events: 5 });
    expect(windowCost(week, "2026-09-01", null)).toEqual({ days: 7, events: 5 });
  });

  it("costs nothing when there is no itinerary to lose", () => {
    expect(windowCost([], null, null)).toEqual({ days: 0, events: 0 });
  });
});

describe("windowCostNoun", () => {
  it("is null when nothing is lost, so callers know not to ask", () => {
    expect(windowCostNoun({ days: 0, events: 0 })).toBeNull();
  });

  it("names days alone when none of them holds anything", () => {
    expect(windowCostNoun({ days: 3, events: 0 })).toBe("3 days");
  });

  it("says one day, not 1 days", () => {
    expect(windowCostNoun({ days: 1, events: 1 })).toBe("1 day and 1 event");
  });

  it("names both", () => {
    expect(windowCostNoun({ days: 2, events: 5 })).toBe("2 days and 5 events");
  });
});

describe("windowCostLabel", () => {
  it("says what pressing the button does", () => {
    expect(windowCostLabel({ days: 2, events: 5 })).toBe(
      "Remove 2 days and 5 events",
    );
  });

  it("is null when there is nothing to confirm", () => {
    expect(windowCostLabel({ days: 0, events: 0 })).toBeNull();
  });
});

describe("windowProblem", () => {
  it("accepts no dates at all (rule 9) and a real window", () => {
    expect(windowProblem(null, null)).toBeNull();
    expect(windowProblem("2026-09-01", "2026-09-10")).toBeNull();
  });

  it("wants both ends, and real dates", () => {
    expect(windowProblem("2026-09-01", null)).toMatch(/both/);
    expect(windowProblem("2026-02-31", "2026-03-02")).toMatch(/both/);
  });

  it("refuses an end before the start", () => {
    expect(windowProblem("2026-09-10", "2026-09-01")).toMatch(/before/);
  });

  it("refuses a window longer than a year", () => {
    expect(windowProblem("2026-01-01", "2026-12-31")).toBeNull();
    expect(windowProblem("2026-01-01", "2027-01-02")).toMatch(/year/);
    expect(MAX_TRIP_DAYS).toBe(366);
  });
});
