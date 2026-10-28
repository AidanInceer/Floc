import { describe, expect, it } from "vitest";

import { countriesFrom } from "./countries";
import { GEO } from "./testing";
import { countryAt } from "./pick";

const land = countriesFrom(GEO);

describe("countryAt", () => {
  it("finds the country a place stands in", () => {
    expect(countryAt(land, { lng: 2, lat: 46 }, 1)).toBe("FR");
    expect(countryAt(land, { lng: 24.5, lat: 35.5 }, 1)).toBe("GR");
  });

  it("is null in the sea", () => {
    expect(countryAt(land, { lng: -20, lat: 40 }, 1)).toBeNull();
  });

  it("takes a small country's dot within reach, so a finger can hit an island", () => {
    expect(countryAt(land, { lng: 15, lat: 36.2 }, 1)).toBe("MT");
    expect(countryAt(land, { lng: 15, lat: 36.2 }, 0.2)).toBeNull();
  });

  it("prefers a dot to the shape around it", () => {
    const enclave = countriesFrom({
      features: [...GEO.features, { id: "SM", geometry: { type: "Point", coordinates: [1, 46] } }],
    });
    expect(countryAt(enclave, { lng: 1.1, lat: 46 }, 0.5)).toBe("SM");
  });
});
