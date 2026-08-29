import { describe, expect, it } from "vitest";

import { dateRange } from "./dates";
import {
  advanceRangePick,
  draggedPast,
  eventKeyGesture,
  eventLanding,
  paintRange,
  pickedRange,
  rangeFromAnchor,
  resolveBandRelease,
} from "./calendar-gestures";
import type { BandSpan } from "./overnight-band";

const span = (start: number, end: number, open = false) => ({ start, end, open });

describe("draggedPast", () => {
  it("is a click within the slop, a drag past it", () => {
    expect(draggedPast(0, 0)).toBe(false);
    expect(draggedPast(3, 0)).toBe(false);
    expect(draggedPast(4, 0)).toBe(true);
    expect(draggedPast(3, 3)).toBe(true); // hypot ≈ 4.24
  });
});

describe("eventLanding", () => {
  it("moves the whole block, keeping the grab offset under the cursor", () => {
    // A 09:00–10:00 block grabbed 15m down, cursor now at 11:15 → starts 11:00.
    expect(eventLanding(span(540, 600), "move", 675, 15)).toEqual({
      time: "11:00",
      endTime: "12:00",
    });
  });

  it("resizes the bottom edge alone, ignoring the offset", () => {
    expect(eventLanding(span(540, 600), "resize", 660, 15)).toEqual({
      time: "09:00",
      endTime: "11:00",
    });
  });

  it("only moves the start of an open-ended block", () => {
    expect(eventLanding(span(540, 570, true), "move", 600, 0)).toEqual({
      time: "10:00",
      endTime: null,
    });
  });
});

describe("eventKeyGesture", () => {
  it("nudges a quarter hour on ↑/↓", () => {
    expect(eventKeyGesture(span(540, 600), "ArrowUp", false)).toEqual({
      kind: "move",
      time: "08:45",
      endTime: "09:45",
    });
    expect(eventKeyGesture(span(540, 600), "ArrowDown", false)).toEqual({
      kind: "move",
      time: "09:15",
      endTime: "10:15",
    });
  });

  it("steps a whole day on shift+←/→, naming direction not destination", () => {
    expect(eventKeyGesture(span(540, 600), "ArrowLeft", true)).toEqual({
      kind: "day",
      step: -1,
      time: "09:00",
      endTime: "10:00",
    });
    expect(eventKeyGesture(span(540, 570, true), "ArrowRight", true)).toEqual({
      kind: "day",
      step: 1,
      time: "09:00",
      endTime: null,
    });
  });

  it("ignores a plain arrow left/right and any other key", () => {
    expect(eventKeyGesture(span(540, 600), "ArrowLeft", false)).toBeNull();
    expect(eventKeyGesture(span(540, 600), "ArrowUp", true)).toBeNull();
    expect(eventKeyGesture(span(540, 600), "Enter", false)).toBeNull();
  });
});

describe("rangeFromAnchor", () => {
  it("orders the two ends, wherever the drag went", () => {
    expect(rangeFromAnchor("2026-05-10", "2026-05-12")).toEqual({
      start: "2026-05-10",
      end: "2026-05-12",
    });
    expect(rangeFromAnchor("2026-05-12", "2026-05-10")).toEqual({
      start: "2026-05-10",
      end: "2026-05-12",
    });
    expect(rangeFromAnchor("2026-05-10", "2026-05-10")).toEqual({
      start: "2026-05-10",
      end: "2026-05-10",
    });
  });
});

describe("pickedRange", () => {
  it("orders the ends, but collapses to a half-made range at its own start", () => {
    expect(pickedRange("2026-05-10", "2026-05-12")).toEqual({
      start: "2026-05-10",
      end: "2026-05-12",
    });
    expect(pickedRange("2026-05-12", "2026-05-10")).toEqual({
      start: "2026-05-10",
      end: "2026-05-12",
    });
    expect(pickedRange("2026-05-10", "2026-05-10")).toEqual({
      start: "2026-05-10",
      end: null,
    });
  });
});

describe("advanceRangePick", () => {
  it("sets a start when nothing is picked", () => {
    expect(advanceRangePick({ start: null, end: null }, "2026-05-10")).toEqual({
      start: "2026-05-10",
      end: null,
    });
  });

  it("sets the end on the second click", () => {
    expect(advanceRangePick({ start: "2026-05-10", end: null }, "2026-05-14")).toEqual({
      start: "2026-05-10",
      end: "2026-05-14",
    });
  });

  it("restarts from a click before the start", () => {
    expect(advanceRangePick({ start: "2026-05-10", end: null }, "2026-05-08")).toEqual({
      start: "2026-05-08",
      end: null,
    });
  });

  it("starts a fresh window once a pair is complete", () => {
    expect(
      advanceRangePick({ start: "2026-05-10", end: "2026-05-14" }, "2026-05-20"),
    ).toEqual({ start: "2026-05-20", end: null });
  });
});

describe("paintRange", () => {
  it("fills the whole span with one value, over the base", () => {
    expect(
      paintRange({ "2026-05-09": true }, "2026-05-10", "2026-05-12", true, dateRange),
    ).toEqual({
      "2026-05-09": true,
      "2026-05-10": true,
      "2026-05-11": true,
      "2026-05-12": true,
    });
  });

  it("recomputes from the anchor, so a shrunk drag drops the days it left", () => {
    // Anchor 05-10; drag out to 05-12 then back to 05-11 paints only 10–11.
    const base = {};
    const out = paintRange(base, "2026-05-10", "2026-05-11", false, dateRange);
    expect(out).toEqual({ "2026-05-10": false, "2026-05-11": false });
    expect(base).toEqual({}); // base untouched — a fresh map each move
  });
});

describe("resolveBandRelease", () => {
  const span: BandSpan = {
    start: "2026-05-10",
    end: "2026-05-12",
    placeId: 7,
    placeName: "Rome",
    uncovered: [["2026-05-13", "2026-05-13"]],
  };

  it("opens the dialog on the pressed day when the press never moved", () => {
    expect(
      resolveBandRelease(
        { mode: "extend", pressedDate: "2026-05-11", placeId: 7, placeName: "Rome", moved: false },
        span,
      ),
    ).toEqual({
      kind: "dialog",
      span: { start: "2026-05-11", end: "2026-05-11", placeId: 7, placeName: "Rome" },
    });
  });

  it("opens the dialog for a paint drag — undecided days have no place yet", () => {
    expect(
      resolveBandRelease(
        { mode: "paint", pressedDate: "2026-05-10", placeId: null, placeName: null, moved: true },
        span,
      ),
    ).toEqual({ kind: "dialog", span });
  });

  it("commits an extend of a run that already has a place", () => {
    expect(
      resolveBandRelease(
        { mode: "extend", pressedDate: "2026-05-10", placeId: 7, placeName: "Rome", moved: true },
        span,
      ),
    ).toEqual({
      kind: "commit",
      span,
      placeId: 7,
      uncovered: [["2026-05-13", "2026-05-13"]],
    });
  });
});
