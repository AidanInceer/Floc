import { describe, expect, it } from "vitest";

import { PRESET_TRIPS, type PresetTrip } from "../preset-trips";
import { OPENING_POOL, openingPick, openingPool } from "./opening-pick";

const winter = [12, 1, 2];
const listing = (id: string, region: PresetTrip["region"], over: Partial<PresetTrip> = {}): PresetTrip => ({
  ...PRESET_TRIPS[0],
  id,
  title: id,
  region,
  bestMonths: "November to March",
  interests: [],
  landscape: [],
  ...over,
});
const ids = (trips: readonly PresetTrip[]) => trips.map((t) => t.id);

const trips = [
  listing("asia-city", "Asia", { interests: ["Cities"] }),
  listing("africa-wild", "Africa", { interests: ["Wildlife"], landscape: ["Savannah"] }),
  listing("europe-food", "Europe", { interests: ["Food"] }),
  listing("oceania-beach", "Oceania", { interests: ["Beaches"], landscape: ["Coast"] }),
  listing("summer-only", "Europe", { bestMonths: "June to August", interests: ["Food"] }),
];

const signedOut = { saved: [], likes: null };

describe("openingPool", () => {
  it("is every top pick of the season for someone signed out", () => {
    expect(ids(openingPool(trips, winter, signedOut))).toEqual(["africa-wild", "asia-city", "europe-food", "oceania-beach"]);
  });

  it("is the top picks that best fit your likes when you have saved nothing", () => {
    const pool = openingPool(trips, winter, { saved: [], likes: ["Food", "Beaches", "Coast"] });
    expect(ids(pool)).toEqual(["oceania-beach", "europe-food", "africa-wild"]);
  });

  it("keeps the season's order among picks that fit you equally", () => {
    expect(ids(openingPool(trips, winter, { saved: [], likes: [] }))).toEqual(["africa-wild", "asia-city", "europe-food"]);
  });

  it(`fills one saved trip up to ${OPENING_POOL} with the picks that fit you`, () => {
    const pool = openingPool(trips, winter, { saved: ["summer-only"], likes: ["Wildlife"] });
    expect(ids(pool)).toEqual(["summer-only", "africa-wild", "asia-city"]);
  });

  it("does not take a saved trip twice when it is a top pick too", () => {
    const pool = openingPool(trips, winter, { saved: ["europe-food"], likes: ["Food"] });
    expect(ids(pool)).toEqual(["europe-food", "africa-wild", "asia-city"]);
  });

  it("is only your saved trips once you have saved enough", () => {
    const saved = ["oceania-beach", "summer-only", "asia-city", "africa-wild"];
    expect(ids(openingPool(trips, winter, { saved, likes: [] }))).toEqual(saved);
  });

  it("skips a saved id that is no longer a listing", () => {
    expect(ids(openingPool(trips, winter, { saved: ["gone"], likes: [] }))).toEqual(["africa-wild", "asia-city", "europe-food"]);
  });

  it("falls back to every listing when nothing suits the season", () => {
    expect(ids(openingPool(trips.slice(4), winter, signedOut))).toEqual(["summer-only"]);
  });
});

describe("openingPick", () => {
  const pool = trips.slice(0, 3);

  it("takes the first trip at the bottom of the roll", () => {
    expect(openingPick(pool, 0).id).toBe("asia-city");
  });

  it("takes the last trip at the top of the roll", () => {
    expect(openingPick(pool, 0.999).id).toBe("europe-food");
  });

  it("stays inside the pool for a roll of one", () => {
    expect(openingPick(pool, 1).id).toBe("europe-food");
  });
});
