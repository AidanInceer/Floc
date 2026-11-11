import { describe, expect, it } from "vitest";

import { stopWeek } from "./stop-weeks";
import { deriveStops, type StopDayInput } from "./stops";

function trip(places: (string | null)[], start = "2026-06-01"): StopDayInput[] {
  const ids = new Map<string, number>();
  return places.map((name, i) => {
    const date = new Date(`${start}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + i);
    if (name && !ids.has(name)) ids.set(name, ids.size + 1);
    return {
      dayId: i + 1,
      date: date.toISOString().slice(0, 10),
      overnightPlaceId: name ? ids.get(name)! : null,
      overnightPlaceName: name,
    };
  });
}

function week(places: (string | null)[], focus: number) {
  const days = trip(places);
  return stopWeek(days.map((d) => d.date), deriveStops(days), focus);
}

const SEVENTEEN: (string | null)[] = [
  ...Array<string>(4).fill("Lisbon"),
  ...Array<string>(5).fill("Porto"),
  ...Array<null>(6).fill(null),
  ...Array<string>(2).fill("Faro"),
];

describe("stopWeek", () => {
  it("shows the trip week that holds the focused day, counted from the trip's first day", () => {
    const w = week(SEVENTEEN, 9);
    expect(w.week).toBe(1);
    expect(w.weeks).toBe(3);
    expect(w.dates).toEqual(["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14"]);
  });

  it("names the days it shows", () => {
    expect(week(SEVENTEEN, 0).note).toBe("Days 1–7 of 17");
    expect(week(SEVENTEEN, 16).note).toBe("Days 15–17 of 17");
  });

  it("fills a short last week with the dates after the trip, so the columns stay seven", () => {
    const w = week(SEVENTEEN, 16);
    expect(w.dates).toEqual(["2026-06-15", "2026-06-16", "2026-06-17"]);
    expect(w.pad).toEqual(["2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"]);
  });

  it("cuts a stop at the week's edge and says which side runs on", () => {
    const w = week(SEVENTEEN, 7);
    expect(w.segments.map(({ stop, column, span, cutLeft, cutRight }) =>
      [stop.placeName, column, span, cutLeft, cutRight])).toEqual([
      ["Porto", 0, 2, true, false],
      [null, 2, 5, false, true],
    ]);
  });

  it("keeps a whole stop uncut when it fits in the week", () => {
    const w = week(SEVENTEEN, 0);
    expect(w.segments[0]).toMatchObject({ column: 0, span: 4, cutLeft: false, cutRight: false });
    expect(w.segments[1]).toMatchObject({ column: 4, span: 3, cutLeft: false, cutRight: true });
  });

  it("starts on the first week when no day is focused", () => {
    expect(week(SEVENTEEN, -1).week).toBe(0);
  });

  it("gives a first and last day of each neighbouring week to step to", () => {
    expect(week(SEVENTEEN, 9)).toMatchObject({ before: 0, after: 14 });
    expect(week(SEVENTEEN, 2)).toMatchObject({ before: null, after: 7 });
    expect(week(SEVENTEEN, 15)).toMatchObject({ before: 7, after: null });
  });
});
