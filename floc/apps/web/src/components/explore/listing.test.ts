import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { describe, expect, it } from "vitest";

import { ONE_STOP, RAIL, VIA } from "@/test/route-listings";

import { routeParts, toneOf } from "./listing";

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
