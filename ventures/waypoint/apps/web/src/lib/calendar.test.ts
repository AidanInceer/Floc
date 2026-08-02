import { describe, expect, it } from "vitest";

import {
  clamp,
  formatLength,
  formatSpan,
  gridWindow,
  moveSpan,
  packLanes,
  resizeSpan,
  snap,
  spanOf,
  toHhmm,
  toMinutes,
} from "./calendar";

const timed = (id: number, time: string | null, endTime: string | null = null) => ({
  id,
  time,
  endTime,
  allDay: false,
});

describe("toMinutes", () => {
  it("reads a wall clock as minutes since midnight", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("09:45")).toBe(585);
    expect(toMinutes("23:59")).toBe(1439);
  });

  it("is null for anything that isn't HH:MM", () => {
    expect(toMinutes(null)).toBeNull();
    expect(toMinutes("")).toBeNull();
    expect(toMinutes("9:45")).toBeNull();
    expect(toMinutes("25:00")).toBeNull();
    expect(toMinutes("09:60")).toBeNull();
  });
});

describe("toHhmm", () => {
  it("round-trips through toMinutes", () => {
    expect(toHhmm(585)).toBe("09:45");
    expect(toMinutes(toHhmm(585))).toBe(585);
  });

  it("reaches the grid's bottom edge", () => {
    expect(toHhmm(24 * 60)).toBe("24:00");
  });

  it("clamps rather than wrapping past the ends of the day", () => {
    expect(toHhmm(-30)).toBe("00:00");
    expect(toHhmm(26 * 60)).toBe("24:00");
  });
});

describe("snap", () => {
  it("goes to the nearest quarter hour", () => {
    expect(snap(0)).toBe(0);
    expect(snap(7)).toBe(0);
    expect(snap(8)).toBe(15);
    expect(snap(614)).toBe(615);
  });
});

describe("clamp", () => {
  it("holds a value inside its bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("spanOf", () => {
  it("is null for an all-day event", () => {
    expect(spanOf({ id: 1, time: null, endTime: null, allDay: true })).toBeNull();
  });

  it("is null for a legacy row with no start time, which is the same thing", () => {
    expect(spanOf(timed(1, null))).toBeNull();
  });

  it("reads a start and an end", () => {
    expect(spanOf(timed(1, "09:00", "11:30"))).toEqual({
      start: 540,
      end: 690,
      open: false,
    });
  });

  it("draws an event with no end as a point, and says the end is drawn", () => {
    expect(spanOf(timed(1, "09:00"))).toEqual({ start: 540, end: 570, open: true });
  });

  it("treats an end that isn't after the start as no end at all", () => {
    // The column can't say "next morning" (rule 10), so this is the honest read.
    expect(spanOf(timed(1, "22:00", "02:00"))?.open).toBe(true);
  });

  it("never draws past midnight", () => {
    expect(spanOf(timed(1, "23:50"))).toEqual({ start: 1430, end: 1440, open: true });
  });
});

describe("gridWindow", () => {
  it("is the whole day, whatever is on it", () => {
    // Midnight to midnight for every day of every trip: the same hour has to
    // sit at the same height on Monday as on Tuesday.
    expect(gridWindow([timed(1, "09:00", "10:00")])).toEqual({
      startHour: 0,
      endHour: 24,
    });
  });

  it("keeps an early event on the grid", () => {
    // A 04:40 airport run must never be a row the calendar can't show.
    expect(gridWindow([timed(1, "04:40", "06:00")]).startHour).toBe(0);
  });

  it("ignores all-day events, which have no place on the clock", () => {
    expect(
      gridWindow([{ id: 1, time: null, endTime: null, allDay: true }]),
    ).toEqual({ startHour: 0, endHour: 24 });
  });
});

describe("packLanes", () => {
  it("gives an uncontested event the whole column", () => {
    expect(packLanes([{ id: 1, start: 540, end: 600 }])).toEqual([
      { id: 1, start: 540, end: 600, lane: 0, lanes: 1 },
    ]);
  });

  it("splits two overlapping events into side-by-side lanes", () => {
    const packed = packLanes([
      { id: 1, start: 540, end: 660 },
      { id: 2, start: 600, end: 720 },
    ]);
    expect(packed.map((p) => [p.id, p.lane, p.lanes])).toEqual([
      [1, 0, 2],
      [2, 1, 2],
    ]);
  });

  it("reuses a lane once the event holding it has finished", () => {
    const packed = packLanes([
      { id: 1, start: 540, end: 600 },
      { id: 2, start: 550, end: 700 },
      { id: 3, start: 610, end: 660 },
    ]);
    expect(packed.find((p) => p.id === 3)?.lane).toBe(0);
  });

  it("does not narrow the morning because of a pile-up at noon", () => {
    const packed = packLanes([
      { id: 1, start: 540, end: 600 },
      { id: 2, start: 720, end: 780 },
      { id: 3, start: 730, end: 790 },
      { id: 4, start: 740, end: 800 },
    ]);
    expect(packed.find((p) => p.id === 1)?.lanes).toBe(1);
    expect(packed.find((p) => p.id === 4)?.lanes).toBe(3);
  });
});

describe("moveSpan", () => {
  it("keeps the event's length and snaps to the quarter hour", () => {
    expect(moveSpan({ start: 540, end: 660, open: false }, 607)).toEqual({
      time: "10:00",
      endTime: "12:00",
    });
  });

  it("pushes a block back off the bottom edge rather than truncating it", () => {
    // Dragged past midnight means "as late as it goes", not "make it shorter".
    expect(moveSpan({ start: 540, end: 660, open: false }, 23 * 60)).toEqual({
      time: "22:00",
      endTime: "24:00",
    });
  });

  it("moves an open-ended event without inventing an end for it", () => {
    expect(moveSpan({ start: 540, end: 570, open: true }, 600)).toEqual({
      time: "10:00",
      endTime: null,
    });
  });
});

describe("resizeSpan", () => {
  it("sets the end time from the dragged edge", () => {
    expect(resizeSpan({ start: 540, end: 600 }, 682)).toEqual({
      time: "09:00",
      endTime: "11:15",
    });
  });

  it("won't go shorter than a quarter of an hour", () => {
    expect(resizeSpan({ start: 540, end: 600 }, 400).endTime).toBe("09:15");
  });

  it("gives an open-ended event a real end — the point of the handle", () => {
    expect(resizeSpan({ start: 540, end: 570 }, 720).endTime).toBe("12:00");
  });
});

describe("formatSpan", () => {
  it("says all day for an event that has no time", () => {
    expect(formatSpan({ time: null, endTime: null, allDay: true })).toBe("All day");
    expect(formatSpan({ time: null, endTime: null, allDay: false })).toBe("All day");
  });

  it("shows just the start when there is no end", () => {
    expect(formatSpan({ time: "09:00", endTime: null, allDay: false })).toBe("09:00");
  });

  it("uses an en dash for the range", () => {
    expect(formatSpan({ time: "09:00", endTime: "11:30", allDay: false })).toBe(
      "09:00–11:30",
    );
  });
});

describe("formatLength", () => {
  it("drops the part that is zero", () => {
    expect(formatLength(150)).toBe("2h 30m");
    expect(formatLength(120)).toBe("2h");
    expect(formatLength(45)).toBe("45m");
  });
});
