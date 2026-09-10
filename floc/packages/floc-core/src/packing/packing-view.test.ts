/**
 * Filing, ordering and filtering a packing list (ticket 229). Pure, so the page
 * and these agree by construction — the page does no ordering of its own.
 */
import { describe, expect, it } from "vitest";

import {
  parseCategoryFilter,
  parsePackCategory,
  parsePackSort,
  PACK_SORTS,
  sortPackingLines,
  viewPackingLines,
} from "./packing";
import type { PackCategory } from "./packing";

const line = (label: string, category: PackCategory, quantity = 1) => ({
  label,
  category,
  quantity,
});

const bag = [
  line("socks", "clothes", 6),
  line("passport", "essentials"),
  line("shampoo", "toiletries"),
  line("t-shirt", "clothes", 5),
  line("water bottle", "accessories"),
];

const labels = (list: { label: string }[]) => list.map((l) => l.label);

describe("parsing what came off a URL or a form", () => {
  it("files an unknown category under Other rather than refusing the row", () => {
    expect(parsePackCategory("clothes")).toBe("clothes");
    expect(parsePackCategory("gadgets")).toBe("other");
    expect(parsePackCategory(undefined)).toBe("other");
  });

  it("shows everything when the filter makes no sense (rule 11)", () => {
    expect(parseCategoryFilter("toiletries")).toBe("toiletries");
    expect(parseCategoryFilter("nonsense")).toBe("all");
    expect(parseCategoryFilter(undefined)).toBe("all");
  });

  it("falls back to category order, and refuses a sort the list doesn't offer", () => {
    expect(parsePackSort("name", PACK_SORTS)).toBe("name");
    expect(parsePackSort("junk", PACK_SORTS)).toBe("category");
    // The shared list shows no count, so it never offers to sort by one.
    expect(parsePackSort("quantity", ["category", "name"])).toBe("category");
  });
});

describe("sorting", () => {
  it("orders by name regardless of case", () => {
    const mixed = [line("Zip ties", "other"), line("apples", "other")];
    expect(labels(sortPackingLines(mixed, "name"))).toEqual(["apples", "Zip ties"]);
  });

  it("puts the most-carried first, and breaks ties by name", () => {
    expect(labels(sortPackingLines(bag, "quantity"))).toEqual([
      "socks",
      "t-shirt",
      "passport",
      "shampoo",
      "water bottle",
    ]);
  });

  it("leaves the list alone when the sort is by category", () => {
    expect(labels(sortPackingLines(bag, "category"))).toEqual(labels(bag));
  });
});

describe("the rendered view", () => {
  it("groups under headings in a fixed order, and drops empty ones", () => {
    const view = viewPackingLines(bag, { sort: "category", category: "all" });
    expect(view.map((g) => g.heading)).toEqual([
      "Essentials",
      "Clothes",
      "Toiletries",
      "Accessories",
    ]);
    expect(labels(view[1].lines)).toEqual(["socks", "t-shirt"]);
  });

  it("goes flat and headingless once you sort by something else", () => {
    const view = viewPackingLines(bag, { sort: "name", category: "all" });
    expect(view).toHaveLength(1);
    expect(view[0].heading).toBeNull();
    expect(labels(view[0].lines)).toEqual([
      "passport",
      "shampoo",
      "socks",
      "t-shirt",
      "water bottle",
    ]);
  });

  it("filters to one category, keeping its heading", () => {
    const view = viewPackingLines(bag, { sort: "category", category: "clothes" });
    expect(view).toHaveLength(1);
    expect(labels(view[0].lines)).toEqual(["socks", "t-shirt"]);
  });

  it("filters and sorts together", () => {
    const view = viewPackingLines(bag, { sort: "quantity", category: "clothes" });
    expect(labels(view[0].lines)).toEqual(["socks", "t-shirt"]);
  });

  it("returns nothing at all when the filter matches nothing", () => {
    expect(viewPackingLines(bag, { sort: "category", category: "other" })).toEqual([]);
  });

  it("never mutates the list it was handed", () => {
    const before = labels(bag);
    viewPackingLines(bag, { sort: "name", category: "all" });
    expect(labels(bag)).toEqual(before);
  });

  it("gives a saved list its own heading, after the fixed categories", () => {
    const view = viewPackingLines(
      [
        ...bag,
        { ...line("tripod", "accessories"), kitName: "Photography" },
        { ...line("ND filter", "other"), kitName: "Photography" },
      ],
      { sort: "category", category: "all" },
    );
    expect(view.at(-1)?.heading).toBe("Photography");
    expect(labels(view.at(-1)!.lines)).toEqual(["tripod", "ND filter"]);
    // and it hasn't leaked into the heading it would otherwise have filed under
    expect(labels(view[3].lines)).toEqual(["water bottle"]);
  });
});
