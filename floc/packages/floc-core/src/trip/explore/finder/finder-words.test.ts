import { describe, expect, it } from "vitest";

import { EMPTY_FINDER, type Finder } from "./finder";
import { finderPills, monthsWord, nightsWord, priceWord, scaleWord } from "./finder-words";

const find = (over: Partial<Finder>): Finder => ({ ...EMPTY_FINDER, ...over });

describe("monthsWord", () => {
  it("joins months next to each other into one run", () => {
    expect(monthsWord([5])).toBe("May");
    expect(monthsWord([7, 5, 6])).toBe("May–Jul");
    expect(monthsWord([1, 3, 4])).toBe("Jan, Mar–Apr");
    expect(monthsWord([])).toBe("Any month");
  });
});

describe("nightsWord", () => {
  it("says the range, open at the top of the scale", () => {
    expect(nightsWord(null)).toBe("Any length");
    expect(nightsWord({ min: 9, max: 14 })).toBe("9 to 14 nights");
    expect(nightsWord({ min: 12, max: 21 })).toBe("12+ nights");
    expect(nightsWord({ min: 5, max: 10 })).toBe("Up to 10 nights");
    expect(nightsWord({ min: 7, max: 7 })).toBe("7 nights");
  });
});

describe("priceWord", () => {
  it("says the range in pounds, total or a night", () => {
    expect(priceWord({ unit: "trip", min: null, max: null })).toBe("Any price");
    expect(priceWord({ unit: "trip", min: null, max: 2000 })).toBe("Up to £2,000");
    expect(priceWord({ unit: "trip", min: 1500, max: null })).toBe("From £1,500");
    expect(priceWord({ unit: "night", min: 100, max: 200 })).toBe("£100–£200 a night");
  });

  it("reads the slider's ends, the top one open", () => {
    expect(scaleWord({ unit: "trip", min: null, max: null })).toBe("£0 – £5,000+");
    expect(scaleWord({ unit: "night", min: 50, max: 150 })).toBe("£50 – £150 a night");
  });
});

describe("finderPills", () => {
  it("names each must-have that is set, each with the finder that clears it", () => {
    const f = find({ q: "rail", regions: ["Asia", "Europe"], months: [5], nights: { min: 9, max: 14 }, price: { unit: "trip", min: null, max: 2000 }, likes: ["Food"] });
    const pills = finderPills(f);
    expect(pills.map((p) => p.label)).toEqual(["“rail”", "Asia", "Europe", "May", "9 to 14 nights", "Up to £2,000"]);
    expect(pills[1].clear.regions).toEqual(["Europe"]);
    expect(pills[0].clear.q).toBe("");
    expect(pills[3].clear.months).toEqual([]);
    expect(pills[4].clear.nights).toBeNull();
    expect(pills[5].clear.price).toEqual({ unit: "trip", min: null, max: null });
    expect(pills[5].clear.likes).toEqual(["Food"]);
  });

  it("has nothing to name for an empty finder", () => {
    expect(finderPills(EMPTY_FINDER)).toEqual([]);
  });
});
