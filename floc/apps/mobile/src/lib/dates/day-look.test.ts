import { describe, expect, it } from "vitest";

import { answeredCount, dayLookOf, freeCounts, preferCounts, storedMarks, type LookContext } from "./day-look";

const rows = [
  { userId: "me", date: "2026-12-15", available: true, preferred: false },
  { userId: "ana", date: "2026-12-15", available: true, preferred: false },
  { userId: "ana", date: "2026-12-16", available: true, preferred: false },
  { userId: "bo", date: "2026-12-16", available: false, preferred: false },
];

const base: LookContext = {
  view: "mine",
  counts: freeCounts(rows, "me", {}),
  memberCount: 2,
  tripStart: null,
  tripEnd: null,
  now: "2026-12-16",
  markOf: (d) => (d === "2026-12-15" ? "free" : "off"),
  prefers: () => 0,
  range: null,
  hiOf: () => undefined,
};

describe("freeCounts", () => {
  it("counts only yes answers", () => {
    expect(freeCounts(rows, "me", {}).get("2026-12-16")).toBe(1);
  });

  it("adds and takes away your unsaved days", () => {
    const counts = freeCounts(rows, "me", { "2026-12-15": "off", "2026-12-16": "free" });
    expect(counts.get("2026-12-15")).toBe(1);
    expect(counts.get("2026-12-16")).toBe(2);
  });
});

describe("answeredCount", () => {
  it("counts the others who answered, and you once you mark a day", () => {
    const people = [{ id: "me", days: null }, { id: "ana", days: 4 }, { id: "bo", days: null }];
    expect(answeredCount(people, "me", false)).toBe(1);
    expect(answeredCount(people, "me", true)).toBe(2);
  });
});

describe("preferCounts", () => {
  it("counts the others who prefer a day, and you as you mark it now", () => {
    const marked = [...rows, { userId: "ana", date: "2026-12-16", available: true, preferred: true }, { userId: "me", date: "2026-12-16", available: true, preferred: true }];
    const count = preferCounts(marked, "me", (d) => (d === "2026-12-16" ? "free" : "prefer"));
    expect(count("2026-12-16")).toBe(1);
    expect(count("2026-12-15")).toBe(1);
  });
});

describe("storedMarks", () => {
  it("reads only your rows and tells a preferred day from a free one", () => {
    const mine = storedMarks([...rows, { userId: "me", date: "2026-12-20", available: true, preferred: true }], "me");
    expect(mine("2026-12-15")).toBe("free");
    expect(mine("2026-12-20")).toBe("prefer");
    expect(mine("2026-12-16")).toBe("off");
  });
});

describe("dayLookOf", () => {
  it("says a preferred day", () => {
    const look = dayLookOf({ ...base, markOf: () => "prefer" }, "2026-12-15");
    expect(look).toMatchObject({ own: "prefer", mine: true });
    expect(look.label).toContain("you prefer it");
  });

  it("shades a day darker when people prefer it, and says so", () => {
    const four = { ...base, memberCount: 4, counts: new Map([["2026-12-16", 1]]) };
    expect(dayLookOf(four, "2026-12-16").mark).toEqual({ kind: "some", step: 1 });
    const look = dayLookOf({ ...four, answered: 2, counts: new Map([["2026-12-16", 2]]), prefers: () => 2 }, "2026-12-16");
    expect(look.mark).toEqual({ kind: "some", step: 3 });
    expect(look.label).toContain("2 prefer it");
  });

  it("draws a day everyone can do as all free, with your disc", () => {
    const look = dayLookOf(base, "2026-12-15");
    expect(look.mark).toEqual({ kind: "all" });
    expect(look.mine).toBe(true);
    expect(look.past).toBe(true);
  });

  it("draws the trip the same on every view", () => {
    const dated = { ...base, tripStart: "2026-12-16", tripEnd: "2026-12-17" };
    expect(dayLookOf({ ...dated, view: "group" }, "2026-12-16").mark).toEqual({ kind: "trip" });
    expect(dayLookOf({ ...dated, view: "mine" }, "2026-12-16").mark).toEqual({ kind: "trip" });
  });

  it("draws the range being picked as the trip and strikes the days it would cut", () => {
    const picking = { ...base, view: "trip" as const, tripStart: "2026-12-15", tripEnd: "2026-12-17", range: { start: "2026-12-16", end: "2026-12-17" } };
    expect(dayLookOf(picking, "2026-12-15")).toMatchObject({ cut: true });
    expect(dayLookOf(picking, "2026-12-16").mark).toEqual({ kind: "trip" });
  });

  it("says the high only on the forecast view", () => {
    const hiOf = () => ({ hi: 18, label: "Sunny" });
    expect(dayLookOf({ ...base, hiOf }, "2026-12-15").hi).toBeUndefined();
    const look = dayLookOf({ ...base, view: "forecast", hiOf }, "2026-12-15");
    expect(look.hi).toBe(18);
    expect(look.label).toContain("Sunny, high 18°");
  });
});
