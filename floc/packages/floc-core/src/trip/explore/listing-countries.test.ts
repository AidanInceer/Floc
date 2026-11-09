import { COUNTRIES } from "../../people/countries";
import { PRESET_TRIPS } from "./preset-trips";
import { describe, expect, it } from "vitest";

import { countryNames, listingCountryCode, listingsIn, regionOf } from "./listing-countries";

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

  it("takes its continent's colour even when no trip goes there", () => {
    expect(regionOf("AO")).toBe("Africa");
    expect(regionOf("AT")).toBe("Europe");
    expect(regionOf("AW")).toBe("Americas");
    expect(regionOf("BB")).toBe("Americas");
    expect(listingsIn("AO")).toEqual([]);
  });

  it("gives every inhabited country a region, and Antarctica none", () => {
    const missing = COUNTRIES.filter((c) => c.code !== "AQ" && regionOf(c.code) === null).map((c) => c.code);
    expect(missing).toEqual([]);
    expect(regionOf("AQ")).toBeNull();
  });

  it("agrees with the region of every Explore trip that goes there", () => {
    for (const trip of PRESET_TRIPS) {
      for (const name of countryNames(trip.country)) expect([name, regionOf(listingCountryCode(name)!)]).toEqual([name, trip.region]);
    }
  });
});
