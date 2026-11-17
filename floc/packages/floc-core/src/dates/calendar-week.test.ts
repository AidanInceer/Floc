import { describe, expect, it } from "vitest";

import { calendarWeek, weekStep, weekTracks, weekdayIndex } from "./calendar-week";

describe("weekdayIndex", () => {
  it("counts Monday as the first day of the week", () => {
    expect(weekdayIndex("2026-12-21")).toBe(0);
  });

  it("counts Sunday as the last day of the week", () => {
    expect(weekdayIndex("2026-12-27")).toBe(6);
  });
});

describe("calendarWeek", () => {
  const trip = { total: 8 };

  it("runs Monday to Sunday around the focus day, with slots before the trip when it starts mid-week", () => {
    expect(calendarWeek("2026-12-25", 1, trip.total).indices).toEqual([-3, -2, -1, 0, 1, 2, 3]);
  });

  it("names the week by its Monday and its Sunday", () => {
    const week = calendarWeek("2026-12-25", 1, trip.total);
    expect([week.monday, week.sunday]).toEqual(["2026-12-21", "2026-12-27"]);
  });

  it("runs past the trip's last day when the trip ends mid-week", () => {
    expect(calendarWeek("2026-12-29", 5, trip.total).indices).toEqual([4, 5, 6, 7, 8, 9, 10]);
  });

  it("has no week before the first week of the trip", () => {
    expect(calendarWeek("2026-12-25", 1, trip.total).canPrev).toBe(false);
  });

  it("has a week after when trip days fall past this Sunday", () => {
    expect(calendarWeek("2026-12-25", 1, trip.total).canNext).toBe(true);
  });

  it("has no week after the week that holds the last day", () => {
    expect(calendarWeek("2026-12-31", 7, trip.total).canNext).toBe(false);
  });
});

describe("weekStep", () => {
  it("keeps the weekday when the same weekday is a trip day next week", () => {
    expect(weekStep(4, 14, 1)).toBe(11);
  });

  it("lands on the nearest trip day when that weekday is past the trip's end", () => {
    expect(weekStep(1, 8, 1)).toBe(7);
  });

  it("lands on the first day when that weekday is before the trip starts", () => {
    expect(weekStep(5, 8, -1)).toBe(0);
  });
});

describe("weekTracks", () => {
  it("gives days outside the trip a narrow track and the focus day the widest", () => {
    expect(weekTracks([-1, 0, 1, 2, 3, 4, 5], 1, 5)).toBe(
      "minmax(0,0.55fr) minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.55fr)",
    );
  });
});
