import { describe, expect, it } from "vitest";

import { EVENT_CATEGORIES } from "./event-categories";

const family = (classes: string) => /bg-pastel-(\w+)\b/.exec(classes)?.[1];

describe("EVENT_CATEGORIES", () => {
  it("gives each category's tile the same colour as its block on Days", () => {
    for (const c of Object.values(EVENT_CATEGORIES)) expect(family(c.tile)).toBe(family(c.block));
  });

  it("gives every category a colour of its own", () => {
    const tiles = Object.values(EVENT_CATEGORIES).map((c) => family(c.tile));
    expect(new Set(tiles).size).toBe(tiles.length);
  });
});
