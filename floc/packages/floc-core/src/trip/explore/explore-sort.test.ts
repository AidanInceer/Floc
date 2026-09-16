import { describe, expect, it } from "vitest";

import { DEFAULT_EXPLORE_SORT, FIXED_RATES_TO_GBP, readExploreSort, sortPresetTrips } from "./explore-sort";
import type { PresetTrip } from "./preset-trip-types";
import { PRESET_TRIPS } from "./preset-trips";

function trip(id: string, over: Partial<PresetTrip>): PresetTrip {
  return { ...PRESET_TRIPS[0], id, title: id, ...over };
}

const ids = (trips: PresetTrip[]) => trips.map((t) => t.id);

describe("readExploreSort", () => {
  it("reads a known sort", () => {
    expect(readExploreSort("longest")).toBe("longest");
  });

  it("falls back to price for anything else", () => {
    expect(DEFAULT_EXPLORE_SORT).toBe("price");
    expect(readExploreSort(undefined)).toBe("price");
    expect(readExploreSort("cheapest")).toBe("price");
    expect(readExploreSort(["az"])).toBe("price");
  });
});

describe("sortPresetTrips", () => {
  const short = trip("b-short", { nights: 3 });
  const long = trip("a-long", { nights: 12 });
  const mid = trip("c-mid", { nights: 7 });

  it("puts the fewest nights first for shortest", () => {
    expect(ids(sortPresetTrips([long, mid, short], "shortest", null))).toEqual(["b-short", "c-mid", "a-long"]);
  });

  it("puts the most nights first for longest", () => {
    expect(ids(sortPresetTrips([short, mid, long], "longest", null))).toEqual(["a-long", "c-mid", "b-short"]);
  });

  it("orders by title for a–z", () => {
    expect(ids(sortPresetTrips([mid, short, long], "az", null))).toEqual(["a-long", "b-short", "c-mid"]);
  });

  it("breaks ties by title", () => {
    const x = trip("x", { nights: 5 });
    const y = trip("y", { nights: 5 });
    expect(ids(sortPresetTrips([y, x], "shortest", null))).toEqual(["x", "y"]);
  });

  it("never reorders the list it was given", () => {
    const list = [long, short];
    sortPresetTrips(list, "shortest", null);
    expect(ids(list)).toEqual(["a-long", "b-short"]);
  });

  describe("price", () => {
    const pounds = trip("pounds", { priceFromMinor: 60000, currency: "GBP" });
    const euros = trip("euros", { priceFromMinor: 65000, currency: "EUR" });

    it("compares across currencies with live rates", () => {
      expect(ids(sortPresetTrips([pounds, euros], "price", { GBP: 1, EUR: 0.9 }))).toEqual(["euros", "pounds"]);
      expect(ids(sortPresetTrips([euros, pounds], "price", { GBP: 1, EUR: 0.95 }))).toEqual(["pounds", "euros"]);
    });

    it("uses fixed rates when there are none", () => {
      expect(ids(sortPresetTrips([pounds, euros], "price", null))).toEqual(["euros", "pounds"]);
    });

    it("uses fixed rates for every listing when one rate is missing", () => {
      expect(ids(sortPresetTrips([pounds, euros], "price", { GBP: 1, EUR: 0 }))).toEqual(["euros", "pounds"]);
    });

    it("has a fixed rate for every listing's currency", () => {
      for (const preset of PRESET_TRIPS) {
        expect(FIXED_RATES_TO_GBP[preset.currency], preset.id).toBeGreaterThan(0);
      }
    });
  });
});
