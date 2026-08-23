import { describe, expect, it } from "vitest";

import {
  addMonths,
  bestWindow,
  candidateRuns,
  daysInMonth,
  monthGrid,
  monthsFrom,
  tally,
  type AvailabilityRow,
} from "./availability";

/** Terse row builder: "a" free on each of the given dates. */
function free(userId: string, ...dates: string[]): AvailabilityRow[] {
  return dates.map((date) => ({ userId, date, available: true }));
}

describe("month arithmetic", () => {
  it("carries the year in both directions", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-07", 12)).toBe("2027-07");
  });

  it("pages forward from a month", () => {
    expect(monthsFrom("2026-11", 3)).toEqual(["2026-11", "2026-12", "2027-01"]);
  });

  it("knows month lengths, including a leap February", () => {
    expect(daysInMonth("2026-02")).toHaveLength(28);
    expect(daysInMonth("2028-02")).toHaveLength(29);
    expect(daysInMonth("2026-09")).toHaveLength(30);
  });
});

describe("monthGrid", () => {
  it("pads to whole Monday-first weeks", () => {
    // 1 Sep 2026 is a Tuesday, so the first row leads with one blank.
    const weeks = monthGrid("2026-09");
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0][0]).toBeNull();
    expect(weeks[0][1]).toBe("2026-09-01");
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });

  it("needs no lead padding when the month starts on a Monday", () => {
    // 1 Jun 2026 is a Monday.
    expect(monthGrid("2026-06")[0][0]).toBe("2026-06-01");
  });
});

describe("tally", () => {
  it("counts only available rows, once per person", () => {
    const rows: AvailabilityRow[] = [
      ...free("a", "2026-09-01"),
      ...free("b", "2026-09-01"),
      { userId: "c", date: "2026-09-01", available: false },
    ];
    expect(tally(rows).get("2026-09-01")).toEqual({
      free: 2,
      freeUserIds: ["a", "b"],
    });
  });
});

describe("bestWindow", () => {
  it("returns null when nobody has marked anything", () => {
    expect(bestWindow([])).toBeNull();
    expect(
      bestWindow([{ userId: "a", date: "2026-09-01", available: false }]),
    ).toBeNull();
  });

  it("prefers a window everyone can do over a longer thinner one", () => {
    const rows = [
      // Three people all free 10–12 Sept.
      ...free("a", "2026-09-10", "2026-09-11", "2026-09-12"),
      ...free("b", "2026-09-10", "2026-09-11", "2026-09-12"),
      ...free("c", "2026-09-10", "2026-09-11", "2026-09-12"),
      // Only "a" is free for the whole of the following week.
      ...free(
        "a",
        "2026-09-20",
        "2026-09-21",
        "2026-09-22",
        "2026-09-23",
        "2026-09-24",
      ),
    ];
    expect(bestWindow(rows)).toEqual({
      start: "2026-09-10",
      end: "2026-09-12",
      free: 3,
    });
  });

  it("drops a threshold rather than waiting for a full house", () => {
    const rows = [
      ...free("a", "2026-09-01", "2026-09-02", "2026-09-03"),
      ...free("b", "2026-09-01", "2026-09-02", "2026-09-03"),
      // "c" has only answered for one day, so no 2+ day run is unanimous.
      ...free("c", "2026-09-01"),
    ];
    expect(bestWindow(rows)).toEqual({
      start: "2026-09-01",
      end: "2026-09-03",
      free: 2,
    });
  });

  it("takes the longest run at a given threshold", () => {
    const rows = [
      ...free("a", "2026-09-01", "2026-09-02"),
      ...free("a", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"),
    ];
    expect(bestWindow(rows)).toEqual({
      start: "2026-09-10",
      end: "2026-09-13",
      free: 1,
    });
  });

  it("falls back to the best-attended single day when nothing is contiguous", () => {
    const rows = [
      ...free("a", "2026-09-05"),
      ...free("b", "2026-09-05"),
      ...free("a", "2026-09-20"),
    ];
    expect(bestWindow(rows)).toEqual({
      start: "2026-09-05",
      end: "2026-09-05",
      free: 2,
    });
  });

  it("spans a month boundary — a run is consecutive dates, not same-month ones", () => {
    const rows = [
      ...free("a", "2026-09-29", "2026-09-30", "2026-10-01"),
      ...free("b", "2026-09-29", "2026-09-30", "2026-10-01"),
    ];
    expect(bestWindow(rows)).toEqual({
      start: "2026-09-29",
      end: "2026-10-01",
      free: 2,
    });
  });

  it("honours a longer minimum length", () => {
    const rows = [
      // A unanimous pair, and a longer run only "a" can do.
      ...free("a", "2026-09-01", "2026-09-02"),
      ...free("b", "2026-09-01", "2026-09-02"),
      ...free("a", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"),
    ];
    expect(bestWindow(rows, 4)).toEqual({
      start: "2026-09-10",
      end: "2026-09-13",
      free: 1,
    });
  });
});

describe("candidate runs", () => {
  // a and b overlap on the 10th–12th; c can only manage the 12th–14th.
  const rows: AvailabilityRow[] = [
    ...free("a", "2026-09-10", "2026-09-11", "2026-09-12"),
    ...free("b", "2026-09-10", "2026-09-11", "2026-09-12"),
    ...free("c", "2026-09-12", "2026-09-13", "2026-09-14"),
  ];

  it("names who each run loses", () => {
    const runs = candidateRuns(rows, ["a", "b", "c"]);
    const best = runs[0];
    expect(best).toMatchObject({ start: "2026-09-10", end: "2026-09-12" });
    expect(best.going.sort()).toEqual(["a", "b"]);
    expect(best.missing).toEqual(["c"]);
  });

  it("counts nights, not days, so a three-day run is two nights", () => {
    expect(candidateRuns(rows, ["a", "b", "c"])[0].nights).toBe(2);
  });

  it("has nothing to offer before anyone has answered", () => {
    expect(candidateRuns([], ["a", "b"])).toEqual([]);
  });
});

describe("the awkward halves of the availability helpers", () => {
  it("counts a person once per day however many rows they have", () => {
    const counts = tally([
      ...free("a", "2026-09-01"),
      ...free("a", "2026-09-01"),
      ...free("b", "2026-09-01"),
    ]);
    expect(counts.get("2026-09-01")).toEqual({ free: 2, freeUserIds: ["a", "b"] });
  });

  it("falls back to the best-attended single day when no run is long enough", () => {
    const rows = [
      ...free("a", "2026-09-01", "2026-09-05"),
      ...free("b", "2026-09-05"),
    ];
    expect(bestWindow(rows, 2)).toEqual({
      start: "2026-09-05",
      end: "2026-09-05",
      free: 2,
    });
  });

  it("drops runs shorter than minNights and caps the list at limit", () => {
    const rows = [
      ...free("a", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"),
      ...free("b", "2026-09-01", "2026-09-02", "2026-09-03"),
      ...free("c", "2026-09-01", "2026-09-02"),
    ];
    expect(candidateRuns(rows, ["a", "b", "c"], { minNights: 4 })).toEqual([]);
    expect(candidateRuns(rows, ["a", "b", "c"], { limit: 1 })).toHaveLength(1);
  });

  it("names who is missing from a run", () => {
    const rows = [
      ...free("a", "2026-09-01", "2026-09-02"),
      ...free("b", "2026-09-01", "2026-09-02"),
    ];
    const [run] = candidateRuns(rows, ["a", "b", "c"]);
    expect(run.going).toEqual(["a", "b"]);
    expect(run.missing).toEqual(["c"]);
  });
});
