import { describe, expect, it } from "vitest";

import { mapPicks } from "./map-picks";
import { PRESET_TRIPS } from "./preset-trips";

describe("mapPicks", () => {
  it("takes the first two of each region, no more", () => {
    const picks = mapPicks(PRESET_TRIPS, 2);
    for (const region of new Set(PRESET_TRIPS.map((t) => t.region))) {
      const inRegion = PRESET_TRIPS.filter((t) => t.region === region);
      expect(picks.filter((t) => t.region === region), region).toEqual(inRegion.slice(0, 2));
    }
  });
});
