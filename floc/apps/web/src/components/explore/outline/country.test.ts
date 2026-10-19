import { readFileSync } from "node:fs";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { describe, expect, it } from "vitest";

import { outlineCode } from "./country";
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
    const missing = PRESET_TRIPS.filter((t) => !drawn.has(outlineCode(t.country) ?? "")).map((t) => t.country);
    expect(missing).toEqual([]);
  });

  it("finds every listing's country in the fine outline file", () => {
    const land = landFromPacked(JSON.parse(readFileSync("public/land-50m.json", "utf8")));
    const drawn = new Set(land.map((p) => p.code));
    const missing = PRESET_TRIPS.filter((t) => !drawn.has(outlineCode(t.country) ?? "")).map((t) => t.country);
    expect(missing).toEqual([]);
  });
});
