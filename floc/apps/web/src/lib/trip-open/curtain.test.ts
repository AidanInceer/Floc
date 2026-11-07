import { describe, expect, it } from "vitest";

import { curtainAt } from "./curtain";

const bar = { x: 400, y: 12, w: 480, h: 44 };
const card = { x: 24, y: 150, w: 1232, h: 540 };

describe("curtainAt", () => {
  it("starts as a thin sheet just under the top bar", () => {
    const f = curtainAt(0, { bar, card });
    expect(f.card!.y).toBeLessThan(bar.y + bar.h);
    expect(f.card!.h).toBeLessThan(40);
    expect(f.page).toBe(0);
  });

  it("lands exactly on the trip's card, still and square", () => {
    const f = curtainAt(1, { bar, card });
    expect(f.card).toEqual(card);
    expect(f.squash).toEqual({ sx: 1, sy: 1 });
    expect(f.page).toBe(1);
  });

  it("holds the sheet to the bar on a neck that lets go midway", () => {
    expect(curtainAt(0.15, { bar, card }).neck).not.toBeNull();
    expect(curtainAt(0.6, { bar, card }).neck).toBeNull();
  });

  it("squashes as it lands, wider and lower, as the top bar's beads do", () => {
    const f = curtainAt(0.74, { bar, card });
    expect(f.squash.sx).toBeGreaterThan(1);
    expect(f.squash.sy).toBeLessThan(1);
  });

  it("brings the page in only once the squash is over, so two outlines never show", () => {
    for (let t = 0; t < 1; t += 0.01) {
      const f = curtainAt(t, { bar, card });
      if (f.page > 0) expect(f.squash).toEqual({ sx: 1, sy: 1 });
    }
  });
});
