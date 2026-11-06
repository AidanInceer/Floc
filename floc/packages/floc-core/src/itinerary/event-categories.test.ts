import { describe, expect, it } from "vitest";

import { DAY_EVENT_TYPES } from "../vocabulary";
import { EVENT_CATEGORIES } from "./event-categories";

const family = (classes: string) => /\bbg-(pastel-[a-z]+|sheet-\d)\b/.exec(classes)?.[1];

describe("EVENT_CATEGORIES", () => {
  it("gives each category's tile the same colour as its block on Days", () => {
    for (const c of Object.values(EVENT_CATEGORIES)) expect(family(c.tile)).toBe(family(c.block));
  });

  it("offers Other, in grey, beside the three coloured kinds", () => {
    expect(DAY_EVENT_TYPES).toContain("other");
    expect(EVENT_CATEGORIES.other.label).toBe("Other");
    expect(family(EVENT_CATEGORIES.other.block)).toBe("sheet-3");
  });

  it("gives every category a colour of its own", () => {
    const tiles = Object.values(EVENT_CATEGORIES).map((c) => family(c.tile));
    expect(new Set(tiles).size).toBe(tiles.length);
  });
});
