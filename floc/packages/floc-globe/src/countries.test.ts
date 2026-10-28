import { describe, expect, it } from "vitest";

import { countriesFrom, middleOf } from "./countries";
import { GEO } from "./testing";

describe("countriesFrom", () => {
  it("keeps one shape per polygon and one dot per point, each with its code", () => {
    const land = countriesFrom(GEO);
    expect(land.shapes.map((s) => s.code)).toEqual(["FR", "GR", "GR"]);
    expect(land.dots).toEqual([{ code: "MT", at: { lng: 14.4, lat: 35.9 } }]);
  });

  it("boxes each shape and finds the circle that holds it", () => {
    const [france] = countriesFrom(GEO).shapes;
    expect(france!.box).toEqual({ west: -2, south: 43, east: 4, north: 49 });
    expect(france!.centre.lat).toBeCloseTo(46, 0);
    expect(france!.reach).toBeGreaterThan(3);
  });
});

describe("middleOf", () => {
  const land = countriesFrom(GEO);

  it("is the middle of a country's largest shape", () => {
    const greece = middleOf(land, "GR")!;
    expect(greece.lng).toBeCloseTo(23.5, 0);
    expect(greece.lat).toBeCloseTo(39.5, 0);
  });

  it("is the dot of a country drawn as a point", () => {
    expect(middleOf(land, "MT")).toEqual({ lng: 14.4, lat: 35.9 });
  });

  it("is null for a country the outline does not have", () => {
    expect(middleOf(land, "ZZ")).toBeNull();
  });
});
