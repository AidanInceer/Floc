import { describe, expect, it } from "vitest";

import { countriesAt } from "./country-at";

describe("countriesAt", () => {
  it("finds the country a point stands in from the outlines", () => {
    expect(countriesAt([{ lat: 38.72, lng: -9.14 }, { lat: 48.86, lng: 2.35 }])).toEqual(["PT", "FR"]);
  });

  it("names each country once and skips a point at sea", () => {
    expect(countriesAt([{ lat: 41.15, lng: -8.61 }, { lat: 38.72, lng: -9.14 }, { lat: 45, lng: -30 }])).toEqual(["PT"]);
  });
});
