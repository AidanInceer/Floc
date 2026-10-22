import { describe, expect, it } from "vitest";

import { stopsOf } from "../listing-stops";
import { PRESET_TRIPS } from "../preset-trips";
import { stopCountry } from "./stop-country";

describe("stopCountry", () => {
  it("reads the listing's own country", () => {
    expect(stopCountry({ country: "Japan" }, undefined)).toBe("JP");
  });

  it("prefers the stop's own country on a listing that crosses borders", () => {
    expect(stopCountry({ country: "Kenya, Tanzania" }, "TZ")).toBe("TZ");
  });

  it("answers null when nothing names a country", () => {
    expect(stopCountry({ country: "Kenya, Tanzania" }, undefined)).toBeNull();
  });

  it("gives every stop of every listing a country", () => {
    for (const trip of PRESET_TRIPS) {
      for (const [i, stop] of stopsOf(trip).entries()) {
        expect(stopCountry(trip, stop.country), `${trip.id} stop ${i + 1}`).not.toBeNull();
      }
    }
  });
});
