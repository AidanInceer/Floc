import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { describe, expect, it } from "vitest";

import { ONE_STOP, RAIL, VIA } from "@/test/route-listings";

import { routeParts, routeStops, toneOf } from "./listing";

describe("routeStops", () => {
  it("pins each base in order, numbered from one, with its nights as days", () => {
    expect(routeStops(ONE_STOP)).toEqual([{ no: 1, name: "Praiano", days: 7, lat: 40.611, lng: 14.529 }]);
  });

  it("leaves hops off the map", () => {
    const trip = PRESET_TRIPS.find((t) => t.legs.some((l) => l.kind === "hop") && t.legs.length > 2)!;
    const bases = trip.legs.filter((l) => l.kind === "base").length;
    expect(routeStops(trip).map((s) => s.no)).toEqual(Array.from({ length: bases }, (_, i) => i + 1));
  });
});

describe("routeParts", () => {
  it("is each stay in order, with the move between two stays", () => {
    expect(routeParts(RAIL).slice(0, 3)).toEqual([
      { kind: "stay", place: "Tokyo", nights: 2, dayTrips: [] },
      { kind: "move", mode: "train", text: "1h 30" },
      { kind: "stay", place: "Hakone", nights: 2, dayTrips: [] },
    ]);
  });

  it("hangs a hop that leads to no new stay on the stay before it, as a day trip", () => {
    expect(routeParts(ONE_STOP)).toEqual([
      { kind: "stay", place: "Praiano", nights: 7, dayTrips: [{ mode: "ferry", text: "Positano, Amalfi, Capri · day hops" }] },
    ]);
  });

  it("names the way when it is not the place you stay next", () => {
    expect(routeParts(VIA)[1]).toEqual({ kind: "move", mode: "car", text: "High Atlas · 2h" });
  });

  it("leaves the way out when the next stay already names it", () => {
    expect(routeParts(RAIL)[3]).toEqual({ kind: "move", mode: "train", text: "2h 20" });
  });
});

describe("toneOf", () => {
  it("gives each region the colour its tiles and tags already use", () => {
    const of = (region: string) => toneOf(PRESET_TRIPS.find((t) => t.region === region)!);
    expect([of("Europe"), of("Africa"), of("Asia"), of("Americas"), of("Oceania")]).toEqual(["blue", "yellow", "red", "green", "blue"]);
  });
});
