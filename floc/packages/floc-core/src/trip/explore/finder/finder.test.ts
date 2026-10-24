import { describe, expect, it } from "vitest";

import { PRESET_TRIPS, type PresetTrip } from "../preset-trips";
import { EMPTY_FINDER, finderCounts, fits, priceFigure, toggled, withNights, withPrice, withUnit, type Finder } from "./finder";

// Listings made for the test, so the checks do not move when the real listings change.
const listing = (over: Partial<PresetTrip>): PresetTrip => ({ ...PRESET_TRIPS[0], ...over });
const LISBON = listing({ id: "lisbon", title: "Lisbon and the coast", country: "Portugal", region: "Europe", nights: 10, priceFromMinor: 120000, currency: "GBP", bestMonths: "May, June, September" });
const NILE = listing({ id: "nile", title: "The Nile", country: "Egypt", region: "Africa", nights: 14, priceFromMinor: 200000, currency: "EUR", bestMonths: "October to April" });
const ALL = [LISBON, NILE];
const find = (over: Partial<Finder>): Finder => ({ ...EMPTY_FINDER, ...over });

describe("priceFigure", () => {
  it("counts the whole trip in pounds", () => {
    expect(priceFigure(LISBON, "trip")).toBe(1200);
  });

  it("brings euros to pounds at a fixed rate", () => {
    expect(priceFigure(NILE, "trip")).toBe(1700);
  });

  it("counts a night as the whole trip over its nights", () => {
    expect(priceFigure(LISBON, "night")).toBe(120);
  });
});

describe("fits", () => {
  it("lets every listing through an empty finder", () => {
    expect(ALL.every((t) => fits(t, EMPTY_FINDER))).toBe(true);
  });

  it("keeps listings in a chosen region", () => {
    expect(ALL.filter((t) => fits(t, find({ regions: ["Africa"] })))).toEqual([NILE]);
  });

  it("keeps listings good in any chosen month", () => {
    expect(ALL.filter((t) => fits(t, find({ months: [6] })))).toEqual([LISBON]);
    expect(ALL.filter((t) => fits(t, find({ months: [1, 6] })))).toEqual(ALL);
  });

  it("keeps listings inside the nights range", () => {
    expect(ALL.filter((t) => fits(t, find({ nights: { min: 9, max: 12 } })))).toEqual([LISBON]);
  });

  it("puts no ceiling on length at the top of the scale", () => {
    expect(fits(listing({ nights: 30 }), find({ nights: { min: 14, max: 21 } }))).toBe(true);
  });

  it("keeps listings inside the price range, total or a night", () => {
    expect(ALL.filter((t) => fits(t, find({ price: { unit: "trip", min: null, max: 1500 } })))).toEqual([LISBON]);
    expect(ALL.filter((t) => fits(t, find({ price: { unit: "trip", min: 1500, max: null } })))).toEqual([NILE]);
    expect(ALL.filter((t) => fits(t, find({ price: { unit: "night", min: 121, max: null } })))).toEqual([NILE]);
  });

  it("finds a place, a country or a tag by what is typed", () => {
    expect(ALL.filter((t) => fits(t, find({ q: "egypt" })))).toEqual([NILE]);
    expect(ALL.filter((t) => fits(t, find({ q: " Lisbon " })))).toEqual([LISBON]);
    expect(fits(listing({ interests: ["Wildlife"] }), find({ q: "wild" }))).toBe(true);
  });

  it("never filters on what you like", () => {
    expect(ALL.every((t) => fits(t, find({ likes: ["Desert"] })))).toBe(true);
  });

  it("can leave one must-have out, so a facet counts its own options", () => {
    expect(fits(NILE, find({ regions: ["Europe"] }), "regions")).toBe(true);
  });
});

describe("finderCounts", () => {
  it("counts each option with every other must-have kept", () => {
    const counts = finderCounts(ALL, find({ regions: ["Europe"], months: [6] }));
    expect(counts.regions).toMatchObject({ Europe: 1, Africa: 0 });
    expect(counts.months[0]).toBe(0);
    expect(counts.months[5]).toBe(1);
  });

  it("counts listings per night, the longest in the top bar", () => {
    const counts = finderCounts([...ALL, listing({ nights: 30 })], EMPTY_FINDER);
    expect(counts.nights).toHaveLength(19);
    expect(counts.nights[10 - 3]).toBe(1);
    expect(counts.nights[18]).toBe(1);
  });

  it("counts listings per price band, the dearest in the top bar", () => {
    const counts = finderCounts([...ALL, listing({ priceFromMinor: 900000, currency: "GBP" })], EMPTY_FINDER);
    expect(counts.price).toHaveLength(20);
    expect(counts.price[Math.floor(1200 / 250)]).toBe(1);
    expect(counts.price[19]).toBe(1);
  });
});

describe("changing the finder", () => {
  it("adds a value that is missing and takes out one that is there", () => {
    expect(toggled([1, 2], 3)).toEqual([1, 2, 3]);
    expect(toggled([1, 2], 1)).toEqual([2]);
  });

  it("sets a nights range, and none when it spans the scale", () => {
    expect(withNights(EMPTY_FINDER, 12, 9).nights).toEqual({ min: 9, max: 12 });
    expect(withNights(EMPTY_FINDER, 3, 21).nights).toBeNull();
  });

  it("sets a price range, with no floor at 0 and no ceiling at the top", () => {
    expect(withPrice(EMPTY_FINDER, 0, 2000).price).toEqual({ unit: "trip", min: null, max: 2000 });
    expect(withPrice(EMPTY_FINDER, 2500, 1000).price).toEqual({ unit: "trip", min: 1000, max: 2500 });
    expect(withPrice(EMPTY_FINDER, 500, 5000).price).toEqual({ unit: "trip", min: 500, max: null });
  });

  it("starts the range again when the unit changes", () => {
    const set = withPrice(EMPTY_FINDER, 500, 2000);
    expect(withUnit(set, "night").price).toEqual({ unit: "night", min: null, max: null });
    expect(withUnit(set, "trip")).toBe(set);
  });
});
