import { describe, expect, it } from "vitest";

import { EMPTY_FINDER, type Finder } from "./finder";
import { readFinder, savedFinder } from "./finder-read";

const FULL: Finder = {
  q: "rail",
  regions: ["Asia"],
  months: [5, 6],
  nights: { min: 9, max: 14 },
  price: { unit: "night", min: 50, max: 200 },
  likes: ["Food", "Coast"],
};

describe("readFinder", () => {
  it("keeps a valid finder", () => {
    expect(readFinder(FULL)).toEqual(FULL);
  });

  it("drops what it cannot read and keeps the rest", () => {
    const read = readFinder({ ...FULL, regions: ["Asia", "Mars"], months: [0, 5, 13, 5.5], likes: ["Food", "Karaoke"], q: 4 });
    expect(read).toEqual({ ...FULL, q: "", regions: ["Asia"], months: [5], likes: ["Food"] });
  });

  it("drops a nights or price range that is off the scale or upside down", () => {
    expect(readFinder({ ...FULL, nights: { min: 14, max: 9 } })?.nights).toBeNull();
    expect(readFinder({ ...FULL, nights: { min: 2, max: 9 } })?.nights).toBeNull();
    expect(readFinder({ ...FULL, price: { unit: "week", min: 1, max: 2 } })?.price).toEqual(EMPTY_FINDER.price);
    expect(readFinder({ ...FULL, price: { unit: "trip", min: 900, max: 100 } })?.price).toEqual(EMPTY_FINDER.price);
    expect(readFinder({ ...FULL, price: { unit: "night", min: null, max: 2000 } })?.price).toEqual({ unit: "night", min: null, max: null });
    expect(readFinder({ ...FULL, price: { unit: "trip", min: null, max: 9000 } })?.price).toEqual(EMPTY_FINDER.price);
  });

  it("reads nothing from something that is not a finder", () => {
    expect(readFinder(null)).toBeNull();
    expect(readFinder("finder")).toBeNull();
  });
});

describe("savedFinder", () => {
  it("reads the finder a profile holds", () => {
    expect(savedFinder({ finder: FULL })).toEqual(FULL);
  });

  it("reads nothing from answers saved before the finder", () => {
    expect(savedFinder({ size: "5-8", when: "summer", cost: "more", pace: "base", nights: 14 })).toBeNull();
    expect(savedFinder(null)).toBeNull();
  });
});
