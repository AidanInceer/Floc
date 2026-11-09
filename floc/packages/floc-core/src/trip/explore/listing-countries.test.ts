import { PRESET_TRIPS } from "./preset-trips";
import { describe, expect, it } from "vitest";

import { listingCountryCode, listingsIn, regionOf } from "./listing-countries";

describe("a want-to-go country on Explore", () => {
  it("finds the trips that go there, a trip across borders included", () => {
    const japan = listingsIn("JP");
    expect(japan.length).toBeGreaterThan(0);
    expect(japan.every((t) => t.country.includes("Japan"))).toBe(true);
  });

  it("counts a trip across borders for each country it crosses", () => {
    const crossing = PRESET_TRIPS.find((t) => t.country.includes(", "));
    expect(crossing).toBeDefined();
    const [, second] = crossing!.country.split(", ");
    expect(listingsIn(listingCountryCode(second)!)).toContain(crossing);
  });

  it("takes its region from those trips, and none when no trip goes there", () => {
    expect(regionOf("JP")).toBe("Asia");
    expect(regionOf("AQ")).toBeNull();
    expect(listingsIn("AQ")).toEqual([]);
  });
});
