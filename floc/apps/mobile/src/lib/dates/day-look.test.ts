import { describe, expect, it } from "vitest";

import { dayLookOf, freeCounts, type LookContext } from "./day-look";

const rows = [
  { userId: "me", date: "2026-12-15", available: true },
  { userId: "ana", date: "2026-12-15", available: true },
  { userId: "ana", date: "2026-12-16", available: true },
  { userId: "bo", date: "2026-12-16", available: false },
];

const base: LookContext = {
  view: "mine",
  counts: freeCounts(rows, "me", {}),
  memberCount: 2,
  tripStart: null,
  tripEnd: null,
  now: "2026-12-16",
  isFree: (d) => d === "2026-12-15",
  range: null,
  hiOf: () => undefined,
};

describe("freeCounts", () => {
  it("counts only yes answers", () => {
    expect(freeCounts(rows, "me", {}).get("2026-12-16")).toBe(1);
  });

  it("adds and takes away your unsaved days", () => {
    const counts = freeCounts(rows, "me", { "2026-12-15": false, "2026-12-16": true });
    expect(counts.get("2026-12-15")).toBe(1);
    expect(counts.get("2026-12-16")).toBe(2);
  });
});

describe("dayLookOf", () => {
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
