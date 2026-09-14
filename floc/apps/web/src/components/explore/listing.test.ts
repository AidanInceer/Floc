import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { describe, expect, it } from "vitest";

import { routeStops } from "./listing";

describe("routeStops", () => {
  it("pins each base in order, numbered from one, with its nights as days", () => {
    const trip = PRESET_TRIPS.find((t) => t.id === "amalfi-slow-week")!;
    expect(routeStops(trip)).toEqual([{ no: 1, name: "Praiano", days: 7, lat: 40.611, lng: 14.529 }]);
  });

  it("leaves hops off the map", () => {
    const trip = PRESET_TRIPS.find((t) => t.legs.some((l) => l.kind === "hop") && t.legs.length > 2)!;
    const bases = trip.legs.filter((l) => l.kind === "base").length;
    expect(routeStops(trip).map((s) => s.no)).toEqual(Array.from({ length: bases }, (_, i) => i + 1));
  });
});
