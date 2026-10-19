import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { describe, expect, it } from "vitest";

import { routeParts, routeStops } from "./listing";

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

describe("routeParts", () => {
  const partsOf = (id: string) => routeParts(PRESET_TRIPS.find((t) => t.id === id)!);

  it("is each stay in order, with the move between two stays", () => {
    expect(partsOf("andalusia-road-trip")).toEqual([
      { kind: "stay", place: "Seville", nights: 2, dayTrips: [] },
      { kind: "move", mode: "car", text: "1h 30" },
      { kind: "stay", place: "Córdoba", nights: 1, dayTrips: [] },
      { kind: "move", mode: "car", text: "2h 15" },
      { kind: "stay", place: "Granada", nights: 3, dayTrips: [] },
    ]);
  });

  it("hangs a hop that leads to no new stay on the stay before it, as a day trip", () => {
    expect(partsOf("amalfi-slow-week")).toEqual([
      { kind: "stay", place: "Praiano", nights: 7, dayTrips: [{ mode: "ferry", text: "Positano, Amalfi, Capri · day hops" }] },
    ]);
  });

  it("names the way when it is not the place you stay next", () => {
    expect(partsOf("morocco-atlas-sahara")[1]).toEqual({ kind: "move", mode: "car", text: "High Atlas · 2h" });
  });

  it("leaves the way out when the next stay already names it", () => {
    expect(partsOf("egypt-cairo-and-the-nile")[1]).toEqual({ kind: "move", mode: "flight", text: "1h" });
  });
});
