import { describe, expect, it } from "vitest";

import { bestDates, windowHeadline, windowReasons, type DayAnswer } from "./best-dates";
import { dateRange } from "../dates";
import type { LengthChoice, TripLength } from "./trip-length";

const days = (userId: string, start: string, end: string, preferred = false): DayAnswer[] =>
  dateRange(start, end).map((date) => ({ userId, date, available: true, preferred }));
const can = (userId: string, length: TripLength): LengthChoice => ({ userId, length });
const names: Record<string, string> = { a: "Aidan", b: "Nadia", c: "Callum" };
const nameOf = (id: string) => names[id];

describe("best dates", () => {
  it("puts the window the most people can make first", () => {
    const answers = [...days("a", "2027-02-01", "2027-02-28"), ...days("b", "2027-02-10", "2027-02-20"), ...days("c", "2027-02-12", "2027-02-15")];
    const lengths = [can("a", "long_weekend"), can("b", "long_weekend"), can("c", "long_weekend")];

    const [first] = bestDates(answers, lengths);

    expect(first).toMatchObject({ start: "2027-02-12", end: "2027-02-14", nights: 2, works: 3, total: 3 });
  });

  it("breaks a tie on people with the days more of them prefer", () => {
    const answers = [
      ...days("a", "2027-02-01", "2027-02-11"),
      ...days("a", "2027-02-12", "2027-02-14", true),
      ...days("a", "2027-02-15", "2027-02-28"),
      ...days("b", "2027-02-01", "2027-02-28"),
    ];
    const lengths = [can("a", "long_weekend"), can("b", "long_weekend")];

    const [first] = bestDates(answers, lengths);

    expect(first).toMatchObject({ start: "2027-02-12", end: "2027-02-14", works: 2, prefer: 1 });
  });

  it("breaks the last tie with the earliest start, then the shorter stay", () => {
    const answers = [...days("a", "2027-02-01", "2027-02-28"), ...days("b", "2027-02-01", "2027-02-28")];
    const lengths = [can("a", "long_weekend"), can("a", "short_break"), can("b", "long_weekend"), can("b", "short_break")];

    const [first] = bestDates(answers, lengths);

    expect(first).toMatchObject({ start: "2027-02-01", nights: 2 });
  });

  it("leaves out a person whose lengths do not cover the window, and says why", () => {
    const answers = [...days("a", "2027-02-01", "2027-02-28"), ...days("b", "2027-02-01", "2027-02-28"), ...days("c", "2027-02-01", "2027-02-28")];
    const lengths = [can("a", "week"), can("b", "week"), can("c", "short_break")];

    const [first] = bestDates(answers, lengths);

    expect(first).toMatchObject({ nights: 6, works: 2, total: 3 });
    expect(windowHeadline(first)).toBe("6 nights. 2 of 3 can make it.");
    expect(windowReasons(first, nameOf, "a")).toEqual(["Callum wants at most 5 nights"]);
  });

  it("says which days a person cannot do, and speaks to the viewer as you", () => {
    const answers = [...days("a", "2027-02-10", "2027-02-12"), ...days("b", "2027-02-10", "2027-02-13"), ...days("c", "2027-02-10", "2027-02-13")];
    const lengths = [can("b", "long_weekend")];

    const [first] = bestDates(answers, lengths);

    expect(first).toMatchObject({ start: "2027-02-10", end: "2027-02-12", works: 3 });
    const longer = bestDates(answers, lengths).find((w) => w.nights === 3)!;
    expect(windowReasons(longer, nameOf, "a")).toEqual(["You can't do Sat 13 Feb"]);
  });

  it("counts a person who prefers at least half the days", () => {
    const answers = [...days("a", "2027-02-10", "2027-02-11", true), ...days("a", "2027-02-12", "2027-02-12"), ...days("b", "2027-02-10", "2027-02-12")];

    const [first] = bestDates(answers, [can("a", "long_weekend")]);

    expect(first.prefer).toBe(1);
    expect(windowReasons(first, nameOf, "b")).toEqual(["1 prefers these days"]);
  });

  it("counts only the people who marked a day", () => {
    const answers: DayAnswer[] = [...days("a", "2027-02-10", "2027-02-12"), { userId: "b", date: "2027-02-10", available: false, preferred: false }];

    const [first] = bestDates(answers, [can("a", "long_weekend"), can("c", "long_weekend")]);

    expect(first).toMatchObject({ works: 1, total: 1 });
    expect(windowHeadline(first)).toBe("2 nights. 1 person so far.");
  });

  it("falls back to the longest shared run when nobody has said how long", () => {
    const answers = [...days("a", "2027-02-01", "2027-02-20"), ...days("b", "2027-02-05", "2027-02-09")];

    expect(bestDates(answers, [])).toMatchObject([{ start: "2027-02-05", end: "2027-02-09", nights: 4, works: 2, total: 2 }]);
  });

  it("has nothing to offer when nobody marked a day", () => {
    expect(bestDates([], [can("a", "week")])).toEqual([]);
  });

  it("skips a window that starts before today", () => {
    const answers = days("a", "2027-02-01", "2027-02-10");

    const [first] = bestDates(answers, [can("a", "long_weekend")], "2027-02-05");

    expect(first.start).toBe("2027-02-05");
  });

  it("offers three at most, no more than two of one length", () => {
    const answers = [...days("a", "2027-02-01", "2027-02-28"), ...days("b", "2027-02-01", "2027-02-28")];

    const list = bestDates(answers, [can("a", "long_weekend"), can("b", "long_weekend")]);

    expect(list).toHaveLength(3);
    expect(list.filter((w) => w.nights === 2)).toHaveLength(2);
    expect(list[2].start).toBe("2027-02-04");
  });
});
