import { describe, expect, it } from "vitest";

import { kitItemsToAdd } from "./packing-kits";
import type { KitItem } from "./packing-kits";

const item = (label: string, quantity = 1): KitItem => ({
  label,
  category: "accessories",
  quantity,
});

describe("kitItemsToAdd", () => {
  it("adds everything into an empty bag", () => {
    expect(kitItemsToAdd([item("Tripod"), item("ND filter")], [])).toHaveLength(
      2,
    );
  });

  it("leaves a row that is already there alone, whatever its case", () => {
    const out = kitItemsToAdd([item("Tripod", 2), item("ND filter")], [
      { label: "tripod" },
    ]);
    expect(out.map((i) => i.label)).toEqual(["ND filter"]);
  });

  it("lands a repeated label once", () => {
    expect(kitItemsToAdd([item("Battery"), item("battery")], [])).toHaveLength(
      1,
    );
  });

  it("clamps a count that is out of range", () => {
    expect(kitItemsToAdd([item("Battery", 0)], [])[0]?.quantity).toBe(1);
  });

  it("drops a blank label rather than writing an unnamed row", () => {
    expect(kitItemsToAdd([item("   ")], [])).toEqual([]);
  });
});
