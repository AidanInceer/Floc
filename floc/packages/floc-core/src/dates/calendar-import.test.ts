import { describe, expect, it } from "vitest";

import { busyDays, importRange, planFill, type CalendarEvent } from "./calendar-import";

const range = { start: "2027-09-04", end: "2027-09-11" };
const timed = (start: string, end: string, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  start: { dateTime: start },
  end: { dateTime: end },
  ...extra,
});
const hour = (day: string, extra: Partial<CalendarEvent> = {}) =>
  timed(`${day}T10:00:00+01:00`, `${day}T11:00:00+01:00`, extra);

describe("busyDays", () => {
  it("marks the day a timed event falls on, by the date in the response", () => {
    expect(busyDays([timed("2027-09-07T09:30:00+01:00", "2027-09-07T10:30:00+01:00")], range)).toEqual(["2027-09-07"]);
  });

  it("spreads a timed event over every day it overlaps", () => {
    const e = timed("2027-09-06T22:00:00+01:00", "2027-09-08T08:00:00+01:00");
    expect(busyDays([e], range)).toEqual(["2027-09-06", "2027-09-07", "2027-09-08"]);
  });

  it("does not touch the day an event ends on at midnight", () => {
    const e = timed("2027-09-06T20:00:00+01:00", "2027-09-07T00:00:00+01:00");
    expect(busyDays([e], range)).toEqual(["2027-09-06"]);
  });

  it("treats an all-day end date as exclusive", () => {
    const one: CalendarEvent = { start: { date: "2027-09-21" }, end: { date: "2027-09-22" } };
    const three: CalendarEvent = { start: { date: "2027-09-05" }, end: { date: "2027-09-08" } };
    expect(busyDays([one], { start: "2027-09-20", end: "2027-09-23" })).toEqual(["2027-09-21"]);
    expect(busyDays([three], range)).toEqual(["2027-09-05", "2027-09-06", "2027-09-07"]);
  });

  it("ignores declined and cancelled events", () => {
    const declined = hour("2027-09-05", {
      attendees: [{ self: false, responseStatus: "accepted" }, { self: true, responseStatus: "declined" }],
    });
    const cancelled = hour("2027-09-06", { status: "cancelled" });
    expect(busyDays([declined, cancelled], range)).toEqual([]);
  });

  it("counts an event somebody else declined", () => {
    const e = hour("2027-09-05", { attendees: [{ self: false, responseStatus: "declined" }] });
    expect(busyDays([e], range)).toEqual(["2027-09-05"]);
  });

  it("counts tentative and unanswered events", () => {
    const e = (s: string) => hour("2027-09-05", { attendees: [{ self: true, responseStatus: s }] });
    expect(busyDays([e("tentative")], range)).toEqual(["2027-09-05"]);
    expect(busyDays([e("needsAction")], range)).toEqual(["2027-09-05"]);
  });

  it("keeps only days in range, sorted, once each", () => {
    const events: CalendarEvent[] = [
      hour("2027-09-12"),
      hour("2027-09-09"),
      timed("2027-09-09T14:00:00+01:00", "2027-09-09T15:00:00+01:00"),
      { start: { date: "2027-09-02" }, end: { date: "2027-09-06" } },
    ];
    expect(busyDays(events, range)).toEqual(["2027-09-04", "2027-09-05", "2027-09-09"]);
  });

  it("skips an event with no usable start, and survives a zero-length one", () => {
    expect(busyDays([{}, { start: { date: "nope" }, end: { date: "nope" } }], range)).toEqual([]);
    const zero = timed("2027-09-07T00:00:00+01:00", "2027-09-07T00:00:00+01:00");
    expect(busyDays([zero], range)).toEqual(["2027-09-07"]);
  });
});

describe("planFill", () => {
  it("fills unmarked days only: busy where the calendar says, free elsewhere", () => {
    const plan = planFill(
      { start: "2027-09-04", end: "2027-09-08" },
      new Set(["2027-09-06"]),
      new Set(["2027-09-05", "2027-09-06"]),
    );
    expect(plan).toEqual({ free: ["2027-09-04", "2027-09-07", "2027-09-08"], busy: ["2027-09-05"] });
  });

  it("does nothing when every day is marked", () => {
    const marked = new Set(["2027-09-04", "2027-09-05"]);
    expect(planFill({ start: "2027-09-04", end: "2027-09-05" }, marked, new Set())).toEqual({ free: [], busy: [] });
  });
});

describe("importRange", () => {
  it("is the trip's dates when it has them", () => {
    expect(importRange("2027-09-04", "2027-09-11", "2027-03")).toEqual({ start: "2027-09-04", end: "2027-09-11" });
  });

  it("is the month on screen when the trip is undated", () => {
    expect(importRange(null, null, "2027-02")).toEqual({ start: "2027-02-01", end: "2027-02-28" });
  });

  it("is capped at a year", () => {
    expect(importRange("2027-01-01", "2029-01-01", "2027-01")).toEqual({ start: "2027-01-01", end: "2028-01-01" });
  });
});
