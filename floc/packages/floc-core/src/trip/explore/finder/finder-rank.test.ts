import { describe, expect, it } from "vitest";

import { PRESET_TRIPS, type PresetTrip } from "../preset-trips";
import { EMPTY_FINDER, type Finder } from "./finder";
import { rankTrips, sortLabel } from "./finder-rank";

const listing = (id: string, over: Partial<PresetTrip>): PresetTrip => ({
  ...PRESET_TRIPS[0],
  id,
  title: id,
  legs: [{ kind: "base", place: id, nights: 10, lat: 0, lng: 0 }],
  nights: 10,
  currency: "GBP",
  effort: "Easy",
  ...over,
});
const FOOD = listing("food", { interests: ["Food", "Cities"], landscape: ["Coast"], priceFromMinor: 200000 });
const WALK = listing("walk", { interests: ["Hiking"], landscape: ["Mountains"], priceFromMinor: 150000, nights: 12 });
const BOTH = listing("both", { interests: ["Food", "Hiking"], landscape: ["Mountains"], priceFromMinor: 300000 });
const ALL = [FOOD, WALK, BOTH];
const ids = (rows: { trip: PresetTrip }[]) => rows.map((r) => r.trip.id);
const find = (over: Partial<Finder>): Finder => ({ ...EMPTY_FINDER, ...over });

describe("rankTrips", () => {
  it("puts the listings with most of what you like first", () => {
    const rows = rankTrips(ALL, find({ likes: ["Food", "Mountains"] }), "match");
    expect(ids(rows)).toEqual(["both", "walk", "food"]);
    expect(rows[0].hits).toEqual(["Food", "Mountains"]);
  });

  it("breaks a tie by price, cheapest first", () => {
    expect(ids(rankTrips(ALL, find({ likes: ["Hiking"] }), "match"))).toEqual(["walk", "both", "food"]);
  });

  it("keeps a listing with none of what you like, last", () => {
    expect(ids(rankTrips(ALL, find({ likes: ["Desert"] }), "match"))).toHaveLength(3);
  });

  it("leaves out what does not fit a must-have", () => {
    expect(ids(rankTrips(ALL, find({ nights: { min: 11, max: 14 } }), "match"))).toEqual(["walk"]);
  });

  it("sorts by price or by length when asked", () => {
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "cheap"))).toEqual(["walk", "food", "both"]);
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "dear"))).toEqual(["both", "food", "walk"]);
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "short"))[2]).toBe("walk");
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "long"))[0]).toBe("walk");
  });

  it("puts your saved listings first in the best-match order", () => {
    expect(ids(rankTrips(ALL, find({ likes: ["Food", "Mountains"] }), "match", new Set(["food"])))).toEqual(["food", "both", "walk"]);
  });

  it("leaves saved listings where they fall in other orders", () => {
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "cheap", new Set(["both"])))).toEqual(["walk", "food", "both"]);
  });

  it("puts this season's top picks first, in their own order, in the season order", () => {
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "season", new Set(), ["both", "walk"]))).toEqual(["both", "walk", "food"]);
  });

  it("leads the best-match order with the first three top picks when nothing is liked", () => {
    const CAMP = listing("camp", { priceFromMinor: 100000 });
    const rows = rankTrips([...ALL, CAMP], EMPTY_FINDER, "match", new Set(), ["both", "food", "walk", "camp"]);
    expect(ids(rows)).toEqual(["both", "food", "walk", "camp"]);
  });

  it("keeps saved listings ahead of the top picks in the best-match order", () => {
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "match", new Set(["food"]), ["both"]))).toEqual(["food", "both", "walk"]);
  });

  it("lets what you like rank, not the top picks, once you like something", () => {
    expect(ids(rankTrips(ALL, find({ likes: ["Food"] }), "match", new Set(), ["walk"]))[0]).toBe("food");
  });

  it("orders the best-match order by your figure when you have one", () => {
    const rows = rankTrips(ALL, EMPTY_FINDER, "match", new Set(["food"]), ["food"], { food: 40, walk: 90, both: 70 });
    expect(ids(rows)).toEqual(["walk", "both", "food"]);
    expect(rows.map((r) => r.fit)).toEqual([90, 70, 40]);
  });

  it("puts a listing with no figure last in the best-match order", () => {
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "match", new Set(), [], { food: 40, both: 70 }))).toEqual(["both", "food", "walk"]);
  });

  it("leaves the other orders alone when you have a figure", () => {
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "cheap", new Set(), [], { food: 40, walk: 90, both: 70 }))).toEqual(["walk", "food", "both"]);
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "season", new Set(), ["food"], { food: 40, walk: 90, both: 70 }))[0]).toBe("food");
  });

  it("carries no figure for someone with no travel style", () => {
    expect(rankTrips(ALL, EMPTY_FINDER, "match")[0].fit).toBeNull();
  });

  it("names the best-match order by what it does", () => {
    expect(sortLabel("match", true)).toBe("Best match first");
    expect(sortLabel("match", false)).toBe("Saved first");
    expect(sortLabel("cheap", true)).toBe("Price, low to high");
  });
});
