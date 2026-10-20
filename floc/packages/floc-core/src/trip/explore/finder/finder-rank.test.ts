import { describe, expect, it } from "vitest";

import { PRESET_TRIPS, type PresetTrip } from "../preset-trips";
import { EMPTY_FINDER, type Finder } from "./finder";
import { rankTrips } from "./finder-rank";

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
    const rows = rankTrips(ALL, find({ likes: ["Food", "Mountains"] }), "match", null);
    expect(ids(rows)).toEqual(["both", "walk", "food"]);
    expect(rows[0].hits).toEqual(["Food", "Mountains"]);
  });

  it("breaks a tie by price, cheapest first", () => {
    expect(ids(rankTrips(ALL, find({ likes: ["Hiking"] }), "match", null))).toEqual(["walk", "both", "food"]);
  });

  it("keeps a listing with none of what you like, last", () => {
    expect(ids(rankTrips(ALL, find({ likes: ["Desert"] }), "match", null))).toHaveLength(3);
  });

  it("leaves out what does not fit a must-have", () => {
    expect(ids(rankTrips(ALL, find({ nights: { min: 11, max: 14 } }), "match", null))).toEqual(["walk"]);
  });

  it("sorts by price or by length when asked", () => {
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "cheap", null))).toEqual(["walk", "food", "both"]);
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "dear", null))).toEqual(["both", "food", "walk"]);
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "short", null))[2]).toBe("walk");
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "long", null))[0]).toBe("walk");
  });

  it("ranks by likeness to one listing, without it, naming what they share", () => {
    const rows = rankTrips(ALL, EMPTY_FINDER, "match", "walk");
    expect(ids(rows)).toEqual(["both", "food"]);
    expect(rows[0].shared).toEqual(expect.arrayContaining(["Hiking", "Mountains"]));
    expect(rows[0].shared).not.toContain(WALK.region);
  });

  it("ignores a likeness to a listing that is gone", () => {
    expect(ids(rankTrips(ALL, EMPTY_FINDER, "cheap", "retired"))).toHaveLength(3);
  });
});
