import { describe, expect, it } from "vitest";

import { DEAL_MS, dealEase, dealFrame, dealStarts, resumeAt } from "./deal";

const cards = [
  { top: 8, height: 46, width: 1000 },
  { top: 60, height: 46, width: 1000 },
  { top: 112, height: 46, width: 1000 },
];

describe("dealEase", () => {
  it("starts at 0, ends at 1 and never runs backwards", () => {
    const steps = Array.from({ length: 21 }, (_, i) => dealEase(i / 20));
    expect(steps[0]).toBe(0);
    expect(steps[20]).toBe(1);
    steps.slice(1).forEach((v, i) => expect(v).toBeGreaterThanOrEqual(steps[i]!));
  });

  it("starts soft: the first tenth of the time moves less than a tenth of the way", () => {
    expect(dealEase(0.05)).toBeLessThan(0.1);
  });
});

describe("dealStarts", () => {
  it("puts the first card on the strip's near paper edge and every other card on the far one", () => {
    const [first, second, third] = dealStarts(cards);
    expect(first).toEqual({ bottom: 54, dy: 5 - 54, sx: (1000 - 20) / 1000 });
    expect(second).toEqual({ bottom: 106, dy: 10 - 106, sx: (1000 - 44) / 1000 });
    expect(third!.dy).toBe(10 - 158);
  });
});

describe("dealFrame", () => {
  const starts = dealStarts(cards);

  it("closed, every card sits on a paper edge with its words hidden and no height", () => {
    const frame = dealFrame(0, starts);
    expect(frame.height).toBe(0);
    frame.cards.forEach((c, i) => {
      expect(c.y).toBe(starts[i]!.dy);
      expect(c.ink).toBe(0);
    });
  });

  it("open, every card is in place at full size and the height fits the last card", () => {
    const frame = dealFrame(1, starts);
    expect(frame.height).toBe(158);
    frame.cards.forEach((c) => expect(c).toEqual({ y: 0, sx: 1, ink: 1 }));
  });

  it("half way, each card has come less far than the one above it", () => {
    const { cards: mid } = dealFrame(0.5, starts);
    const travelled = mid.map((c, i) => 1 - c.y / starts[i]!.dy);
    expect(travelled[0]).toBeGreaterThan(travelled[1]!);
    expect(travelled[1]).toBeGreaterThan(travelled[2]!);
  });

  it("never lets the height run past the lowest card, so the page below moves only as far as the cards", () => {
    for (let p = 0; p <= 1; p += 0.1) {
      const frame = dealFrame(p, starts);
      const lowest = Math.max(...frame.cards.map((c, i) => starts[i]!.bottom + c.y));
      expect(frame.height).toBeLessThanOrEqual(Math.max(0, lowest));
    }
  });

  it("deals a long list in about the same time as a short one", () => {
    const many = dealStarts(Array.from({ length: 30 }, (_, i) => ({ top: 8 + i * 52, height: 46, width: 1000 })));
    expect(dealFrame(1, many).cards.every((c) => c.y === 0)).toBe(true);
    expect(dealFrame(0.6, many).cards[0]!.y).toBeGreaterThan(many[0]!.dy * 0.2);
  });
});

describe("resumeAt", () => {
  it("opening from shut starts at the beginning of the clock", () => {
    expect(resumeAt(true, 0)).toBeCloseTo(0, 3);
  });

  it("a click mid-way carries on from where the strip is, not from either end", () => {
    const pos = dealEase(0.4);
    expect(resumeAt(true, pos)).toBeCloseTo(0.4, 3);
    expect(dealEase(resumeAt(false, pos))).toBeCloseTo(1 - pos, 3);
  });

  it("closes quicker than it opens", () => {
    expect(DEAL_MS.close).toBeLessThan(DEAL_MS.open);
  });
});
