import { describe, expect, it } from "vitest";

import { ALL_TINT, REGION_TINT } from "./region-tint";
import { palette, radius, space } from "./theme";

describe("palette", () => {
  it("resolves colour aliases to values, in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const colours = palette(theme);
      expect(Object.keys(colours).length).toBeGreaterThan(0);
      for (const token of ["pastel-blue", "ink", "sheet-3", "rule-2"] as const) {
        expect(colours[token]).toBeTruthy();
        expect(colours[token]).not.toMatch(/var\(/);
      }
    }
  });

  it("differs between light and dark", () => {
    expect(palette("light")).not.toEqual(palette("dark"));
  });

  it("returns the same object on every call", () => {
    expect(palette("light")).toBe(palette("light"));
  });

  it("names only tokens the palette has, for every region and for All", () => {
    const colours = palette("light");
    for (const tint of [...Object.values(REGION_TINT), ALL_TINT]) {
      for (const token of Object.values(tint)) expect(colours).toHaveProperty(token);
    }
  });
});

describe("scales", () => {
  it("only ever grow", () => {
    for (const scale of [space, radius]) {
      const values = Object.values(scale);
      expect(values).toEqual([...values].sort((a, b) => a - b));
    }
  });
});
