import { readFileSync } from "node:fs";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { describe, expect, it } from "vitest";

import { countryNames, outlineCode, tripCodes } from "./country";
import { landFrom, landFromPacked } from "./land";

describe("outlineCode", () => {
  it("is the code of the country by its name", () => {
    expect(outlineCode("Japan")).toBe("JP");
  });

  it("draws Scotland on the outline of the United Kingdom", () => {
    expect(outlineCode("Scotland")).toBe("GB");
  });

  it("is nothing for a name it does not know", () => {
    expect(outlineCode("Atlantis")).toBeNull();
  });

  it("finds every listing's country in the outline file", () => {
    const land = landFrom(JSON.parse(readFileSync("public/countries-110m.geojson", "utf8")));
    const drawn = new Set(land.map((p) => p.code));
    const missing = PRESET_TRIPS.flatMap((t) => countryNames(t.country)).filter((name) => !drawn.has(outlineCode(name) ?? ""));
    expect(missing).toEqual([]);
  });

  it("finds every listing's country in the fine outline file", () => {
    const land = landFromPacked(JSON.parse(readFileSync("public/land-50m.json", "utf8")));
    const drawn = new Set(land.map((p) => p.code));
    const missing = PRESET_TRIPS.flatMap((t) => countryNames(t.country)).filter((name) => !drawn.has(outlineCode(name) ?? ""));
    expect(missing).toEqual([]);
  });

  it("reads a trip across borders as each of its countries", () => {
    expect(countryNames("Vietnam, Cambodia, Thailand")).toEqual(["Vietnam", "Cambodia", "Thailand"]);
    expect(outlineCode("United States")).toBe("US");
  });
});

describe("tripCodes", () => {
  const square = (x: number, y: number, side: number) => [[x, y], [x + side, y], [x + side, y + side], [x, y + side], [x, y]];
  const land = landFrom({
    features: [
      { id: "VN", geometry: { type: "Polygon", coordinates: [square(104, 9, 6)] } },
      { id: "KH", geometry: { type: "Polygon", coordinates: [square(102, 10, 2)] } },
    ],
  });

  it("is every country the stops stand in, in the order they come", () => {
    expect([...tripCodes("Vietnam", [{ lat: 11, lng: 103 }, { lat: 12, lng: 106 }], land)]).toEqual(["KH", "VN"]);
  });

  it("keeps the listing's own countries when its stops miss the outline", () => {
    expect([...tripCodes("Japan", [{ lat: 0, lng: 0 }], land)]).toEqual(["JP"]);
    expect([...tripCodes("Kenya, Tanzania", [], land)]).toEqual(["KE", "TZ"]);
  });

  it("is empty for a place the outline does not know", () => {
    expect(tripCodes("Atlantis", [], land).size).toBe(0);
  });
});
