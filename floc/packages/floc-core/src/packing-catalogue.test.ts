/**
 * The generator's five promises (ticket 221): length sizes it, weather changes
 * what's in it, the tier scales it, no forecast still yields a list, and a
 * second run only ever adds.
 */
import { describe, expect, it } from "vitest";

import {
  generatePackingList,
  newSuggestionsOnly,
  summariseClimate,
  type PackClimate,
} from "./packing-catalogue";

const mild: PackClimate = { hot: false, cold: false, wet: false };
const hot: PackClimate = { hot: true, cold: false, wet: false };
const wet: PackClimate = { hot: false, cold: false, wet: true };
const freezing: PackClimate = { hot: false, cold: true, wet: false };

function countOf(
  list: { label: string; quantity: number }[],
  label: string,
): number | undefined {
  return list.find((s) => s.label === label)?.quantity;
}

function labels(list: { label: string }[]): string[] {
  return list.map((s) => s.label);
}

describe("trip length sizes the counts", () => {
  it("gives one t-shirt a night", () => {
    const five = generatePackingList({ nights: 5, climate: mild, tier: "balanced" });
    expect(countOf(five, "t-shirt")).toBe(5);
    expect(countOf(five, "underwear")).toBe(6); // a night each, plus one spare
  });

  it("leaves the one-per-trip things alone however long it is", () => {
    const long = generatePackingList({ nights: 20, climate: mild, tier: "balanced" });
    expect(countOf(long, "toothbrush")).toBe(1);
    expect(countOf(long, "passport")).toBe(1);
  });

  it("caps the clothes so a month away isn't absurd", () => {
    const month = generatePackingList({ nights: 30, climate: mild, tier: "balanced" });
    expect(countOf(month, "t-shirt")).toBe(10);
    expect(countOf(month, "trousers")).toBe(4);
  });
});

describe("weather changes what's in the bag", () => {
  it("packs shorts, swimwear and sun cream when it's hot", () => {
    const list = labels(generatePackingList({ nights: 4, climate: hot, tier: "balanced" }));
    expect(list).toContain("shorts");
    expect(list).toContain("swimwear");
    expect(list).toContain("sun cream");
    expect(list).not.toContain("jumper");
  });

  it("packs a rain jacket when it's wet", () => {
    const list = labels(generatePackingList({ nights: 4, climate: wet, tier: "balanced" }));
    expect(list).toContain("rain jacket");
    expect(list).not.toContain("shorts");
  });

  it("packs a coat when it's cold", () => {
    const list = labels(generatePackingList({ nights: 4, climate: freezing, tier: "balanced" }));
    expect(list).toContain("warm coat");
    expect(list).toContain("jumper");
  });
});

describe("the tier scales the counts, not the kinds", () => {
  const forTier = (tier: "light" | "balanced" | "comfort") =>
    generatePackingList({ nights: 10, climate: mild, tier });

  it("packs fewer on Light and more on Comfort", () => {
    expect(countOf(forTier("light"), "t-shirt")).toBe(7);
    expect(countOf(forTier("balanced"), "t-shirt")).toBe(10);
    expect(countOf(forTier("comfort"), "t-shirt")).toBe(13);
  });

  it("suggests the same kinds of thing at every tier", () => {
    expect(labels(forTier("light"))).toEqual(labels(forTier("comfort")));
  });

  it("never drops below one of anything", () => {
    const list = generatePackingList({ nights: 1, climate: mild, tier: "light" });
    for (const s of list) expect(s.quantity).toBeGreaterThanOrEqual(1);
  });
});

describe("the cap is a ceiling on the whole row", () => {
  it("counts the spare inside the cap, not on top of it", () => {
    const month = generatePackingList({ nights: 30, climate: mild, tier: "balanced" });
    expect(countOf(month, "underwear")).toBe(14);
  });

  it("lifts with the tier, so Comfort is never just Balanced", () => {
    const long = { nights: 20, climate: mild, tier: "comfort" } as const;
    expect(countOf(generatePackingList(long), "trousers")).toBe(6);
  });
});

describe("degrading when there's nothing to go on", () => {
  it("still returns a starter list with no dates and no forecast", () => {
    const list = generatePackingList({ nights: null, climate: null, tier: "balanced" });
    expect(list.length).toBeGreaterThan(0);
    expect(labels(list)).toContain("toothbrush");
    expect(countOf(list, "t-shirt")).toBe(1);
  });

  it("guesses no weather rather than the wrong weather", () => {
    const list = labels(generatePackingList({ nights: 3, climate: null, tier: "balanced" }));
    expect(list).not.toContain("shorts");
    expect(list).not.toContain("rain jacket");
    expect(list).toContain("jumper"); // the not-hot default, not a weather call
  });
});

describe("summariseClimate", () => {
  it("has no opinion without days", () => {
    expect(summariseClimate([])).toBeNull();
  });

  it("packs for the worst day, not the average", () => {
    const c = summariseClimate([
      { condition: "sun", hi: 26, lo: 15 },
      { condition: "rain", hi: 14, lo: 4 },
    ]);
    expect(c).toEqual({ hot: true, cold: true, wet: true });
  });
});

describe("regenerating never clobbers what's already there", () => {
  it("drops every suggestion the bag already holds, whatever the case", () => {
    const list = generatePackingList({ nights: 3, climate: mild, tier: "balanced" });
    const fresh = newSuggestionsOnly(list, ["T-Shirt", " passport "]);
    expect(labels(fresh)).not.toContain("t-shirt");
    expect(labels(fresh)).not.toContain("passport");
    expect(labels(fresh)).toContain("toothbrush");
  });

  it("suggests nothing at all on an unchanged second run", () => {
    const list = generatePackingList({ nights: 3, climate: mild, tier: "balanced" });
    expect(newSuggestionsOnly(list, labels(list))).toEqual([]);
  });
});
