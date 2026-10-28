import { describe, expect, it } from "vitest";

import { countriesFrom } from "./countries";
import { openingPlace } from "./opening";

const at = (lng: number, lat: number) => ({ geometry: { type: "Point", coordinates: [lng, lat] } });
const land = countriesFrom({
  features: [
    { id: "GB", ...at(-2, 54) },
    { id: "FR", ...at(2, 46) },
    { id: "ES", ...at(-4, 40) },
    { id: "IT", ...at(12, 42) },
    { id: "JP", ...at(138, 36) },
    { id: "TH", ...at(101, 15) },
  ],
});

describe("openingPlace", () => {
  it("turns to Europe when nothing is marked", () => {
    expect(openingPlace(land, [])).toEqual({ lat: 47, lng: 4 });
  });

  it("turns to the middle of the largest group of been-there countries", () => {
    const place = openingPlace(land, ["GB", "FR", "ES", "IT", "JP"]);
    expect(place.lng).toBeGreaterThan(-5);
    expect(place.lng).toBeLessThan(10);
    expect(place.lat).toBeGreaterThan(40);
  });

  it("skips a country the outline does not have", () => {
    const japan = openingPlace(land, ["JP", "ZZ"]);
    expect(japan.lat).toBeCloseTo(36);
    expect(japan.lng).toBeCloseTo(138);
  });
});
