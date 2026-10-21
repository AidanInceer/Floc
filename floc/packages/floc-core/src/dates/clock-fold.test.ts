import { describe, expect, it } from "vitest";

import { foldedClock, freeStretches, minuteAt, yAt } from "./clock-fold";

const H = 60;
const sizes = { hourPx: 50, foldPx: 30 };

describe("foldedClock", () => {
  it("draws an hour either side of the day's events and no more", () => {
    const clock = foldedClock([{ start: 9 * H, end: 10 * H }], { ...sizes, unfold: false });
    expect(clock.from).toBe(8 * H);
    expect(clock.to).toBe(11 * H);
    expect(clock.height).toBe(150);
  });

  it("shows eight to eight when nothing is planned", () => {
    const clock = foldedClock([], { ...sizes, unfold: false });
    expect([clock.from, clock.to]).toEqual([8 * H, 20 * H]);
  });

  it("folds two or more empty hours between events into one bar", () => {
    const clock = foldedClock(
      [
        { start: 9 * H, end: 10 * H },
        { start: 14 * H, end: 15 * H },
      ],
      { ...sizes, unfold: false },
    );
    const folds = clock.segments.filter((s) => s.folded);
    expect(folds).toEqual([{ from: 10 * H, to: 14 * H, folded: true, y: 100, height: 30 }]);
    expect(clock.height).toBe(50 * 4 + 30);
  });

  it("leaves a single empty hour open", () => {
    const clock = foldedClock(
      [
        { start: 9 * H, end: 10 * H },
        { start: 11 * H, end: 12 * H },
      ],
      { ...sizes, unfold: false },
    );
    expect(clock.segments.some((s) => s.folded)).toBe(false);
  });

  it("counts an hour as busy when an event only touches part of it", () => {
    const clock = foldedClock(
      [
        { start: 9 * H, end: 10 * H + 30 },
        { start: 12 * H + 45, end: 13 * H },
      ],
      { ...sizes, unfold: false },
    );
    expect(clock.segments.filter((s) => s.folded)).toEqual([]);
  });

  it("draws every hour of the day, unfolded, when asked", () => {
    const clock = foldedClock(
      [
        { start: 9 * H, end: 10 * H },
        { start: 14 * H, end: 15 * H },
      ],
      { ...sizes, unfold: true },
    );
    expect([clock.from, clock.to]).toEqual([0, 24 * H]);
    expect(clock.segments.some((s) => s.folded)).toBe(false);
    expect(clock.height).toBe(24 * 50);
  });
});

describe("yAt and minuteAt", () => {
  const clock = foldedClock(
    [
      { start: 9 * H, end: 10 * H },
      { start: 14 * H, end: 15 * H },
    ],
    { ...sizes, unfold: false },
  );

  it("places a minute inside an open hour in proportion", () => {
    expect(yAt(clock, 9 * H + 30)).toBe(75);
  });

  it("places a minute after a fold below the bar", () => {
    expect(yAt(clock, 14 * H)).toBe(130);
  });

  it("holds a minute outside the window at the nearest edge", () => {
    expect(yAt(clock, 2 * H)).toBe(0);
    expect(yAt(clock, 23 * H)).toBe(clock.height);
  });

  it("reads a height back as the minute drawn there", () => {
    for (const m of [8 * H, 9 * H + 15, 12 * H, 14 * H + 40]) {
      expect(minuteAt(clock, yAt(clock, m))).toBeCloseTo(m);
    }
  });

  it("reads a height off either end as the window's edge", () => {
    expect(minuteAt(clock, -20)).toBe(8 * H);
    expect(minuteAt(clock, clock.height + 20)).toBe(16 * H);
  });
});

describe("freeStretches", () => {
  const open = (spans: { start: number; end: number }[]) =>
    foldedClock(spans, { ...sizes, unfold: true });

  it("finds an hour and a half or more between two events", () => {
    const spans = [
      { start: 9 * H, end: 10 * H },
      { start: 12 * H, end: 13 * H },
    ];
    expect(freeStretches(spans, open(spans))).toEqual([{ from: 10 * H, to: 12 * H }]);
  });

  it("ignores a shorter gap", () => {
    const spans = [
      { start: 9 * H, end: 10 * H },
      { start: 11 * H, end: 12 * H },
    ];
    expect(freeStretches(spans, open(spans))).toEqual([]);
  });

  it("measures from the latest end, so an overlap does not invent a gap", () => {
    const spans = [
      { start: 9 * H, end: 13 * H },
      { start: 10 * H, end: 11 * H },
      { start: 14 * H, end: 15 * H },
    ];
    expect(freeStretches(spans, open(spans))).toEqual([]);
  });

  it("leaves a stretch the fold already shows to the fold", () => {
    const spans = [
      { start: 9 * H, end: 10 * H },
      { start: 14 * H, end: 15 * H },
    ];
    const folded = foldedClock(spans, { ...sizes, unfold: false });
    expect(freeStretches(spans, folded)).toEqual([]);
  });
});
