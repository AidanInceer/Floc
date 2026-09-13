import { describe, expect, it } from "vitest";

import { tripCalendar, type CalendarEntry } from "./ics";

const now = new Date(Date.UTC(2026, 8, 13, 10, 30, 0));

const entry = (over: Partial<CalendarEntry> = {}): CalendarEntry => ({
  id: 1,
  date: "2026-09-01",
  title: "Castle tour",
  time: "09:00",
  endTime: "11:30",
  allDay: false,
  place: null,
  note: null,
  ...over,
});

const lines = (ics: string) => ics.split("\r\n");

describe("a trip as a calendar file", () => {
  it("is one calendar named for the trip, with CRLF line ends", () => {
    const ics = tripCalendar({ tripId: 4, tripName: "Lisbon", entries: [], now });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(lines(ics)).toContain("X-WR-CALNAME:Lisbon");
    expect(lines(ics)).toContain("VERSION:2.0");
  });

  it("gives a timed event floating start and end times, no timezone", () => {
    const ics = tripCalendar({ tripId: 4, tripName: "Lisbon", entries: [entry()], now });
    expect(lines(ics)).toContain("DTSTART:20260901T090000");
    expect(lines(ics)).toContain("DTEND:20260901T113000");
    expect(lines(ics)).toContain("SUMMARY:Castle tour");
    expect(lines(ics)).toContain("DTSTAMP:20260913T103000Z");
  });

  it("escapes a bare carriage return, so a title cannot start a new line", () => {
    const ics = tripCalendar({ tripId: 4, tripName: "L", entries: [entry({ title: "A\rX-EVIL:1" })], now });
    expect(lines(ics)).toContain("SUMMARY:A\\nX-EVIL:1");
  });

  it("keeps the same UID for an event across exports, so a feed updates it", () => {
    const a = tripCalendar({ tripId: 4, tripName: "L", entries: [entry({ id: 9 })], now });
    const b = tripCalendar({
      tripId: 4,
      tripName: "L",
      entries: [entry({ id: 9, time: "10:00" })],
      now,
    });
    const uid = (ics: string) => lines(ics).find((l) => l.startsWith("UID:"));
    expect(uid(a)).toBe(uid(b));
    expect(uid(a)).toBe("UID:trip-4-event-9@floc");
  });

  it("gives an event with no end time a start only", () => {
    const ics = tripCalendar({
      tripId: 4,
      tripName: "L",
      entries: [entry({ endTime: null })],
      now,
    });
    expect(lines(ics).some((l) => l.startsWith("DTEND"))).toBe(false);
  });

  it("makes an all-day event span its one date", () => {
    const ics = tripCalendar({
      tripId: 4,
      tripName: "L",
      entries: [entry({ allDay: true, time: null, endTime: null, date: "2026-09-30" })],
      now,
    });
    expect(lines(ics)).toContain("DTSTART;VALUE=DATE:20260930");
    expect(lines(ics)).toContain("DTEND;VALUE=DATE:20261001");
  });

  it("treats an event with no start time as all-day", () => {
    const ics = tripCalendar({
      tripId: 4,
      tripName: "L",
      entries: [entry({ time: null })],
      now,
    });
    expect(lines(ics)).toContain("DTSTART;VALUE=DATE:20260901");
  });

  it("carries the place and the note, which holds the booking reference", () => {
    const ics = tripCalendar({
      tripId: 4,
      tripName: "L",
      entries: [entry({ place: "Lisbon Airport", note: "Ref ABC123" })],
      now,
    });
    expect(lines(ics)).toContain("LOCATION:Lisbon Airport");
    expect(lines(ics)).toContain("DESCRIPTION:Ref ABC123");
  });

  it("escapes the characters the format reserves", () => {
    const ics = tripCalendar({
      tripId: 4,
      tripName: "Ours; yours, too",
      entries: [entry({ note: "Line one\nback\\slash" })],
      now,
    });
    expect(lines(ics)).toContain("X-WR-CALNAME:Ours\\; yours\\, too");
    expect(lines(ics)).toContain("DESCRIPTION:Line one\\nback\\\\slash");
  });

  it("folds a long line at 75 bytes without splitting a character", () => {
    const ics = tripCalendar({
      tripId: 4,
      tripName: "L",
      entries: [entry({ note: "é".repeat(100) })],
      now,
    });
    const encoder = new TextEncoder();
    for (const line of lines(ics)) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain(`DESCRIPTION:${"é".repeat(100)}`);
  });
});
