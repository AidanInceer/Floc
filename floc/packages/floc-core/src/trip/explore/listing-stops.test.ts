import { describe, expect, it } from "vitest";

import { stopsOf } from "./listing-stops";
import { PRESET_TRIPS, type PresetTrip } from "./preset-trips";

type Leg = PresetTrip["legs"][number];
const base = (place: string, nights: number, lat = 0, lng = 0): Leg => ({ kind: "base", place, nights, lat, lng });
const hop = (place: string, mode: "car" | "train" | "ferry" = "train", detail = "2h"): Leg => ({ kind: "hop", place, mode, detail });
const listing = (legs: Leg[]): PresetTrip => ({ ...PRESET_TRIPS[0], legs });

describe("stopsOf", () => {
  it("gives one stop per base, in order, with its nights and place on the map", () => {
    const stops = stopsOf(listing([base("Tokyo", 3, 35.7, 139.7), hop("Kyoto"), base("Kyoto", 2, 35, 135.8)]));
    expect(stops.map(({ place, nights, lat, lng }) => ({ place, nights, lat, lng }))).toEqual([
      { place: "Tokyo", nights: 3, lat: 35.7, lng: 139.7 },
      { place: "Kyoto", nights: 2, lat: 35, lng: 135.8 },
    ]);
  });

  it("makes a hop right before a base the way into that base", () => {
    const [tokyo, kyoto] = stopsOf(listing([base("Tokyo", 3), hop("Kyoto", "train", "2h 15"), base("Kyoto", 2)]));
    expect(tokyo.arrive).toBeNull();
    expect(kyoto.arrive).toEqual({ place: "Kyoto", mode: "train", detail: "2h 15" });
  });

  it("makes any other hop a day out from the stop before it", () => {
    const [kyoto, osaka] = stopsOf(listing([base("Kyoto", 3), hop("Nara", "train", "45m"), hop("Osaka"), base("Osaka", 2), hop("Kobe", "car", "1h")]));
    expect(kyoto.dayOuts).toEqual([{ place: "Nara", mode: "train", detail: "45m" }]);
    expect(osaka.arrive?.place).toBe("Osaka");
    expect(osaka.dayOuts).toEqual([{ place: "Kobe", mode: "car", detail: "1h" }]);
  });

  it("keeps a hop before the first base as the way in, and drops a day out with no stop to leave from", () => {
    const [first] = stopsOf(listing([hop("Nowhere"), hop("Lisbon", "ferry"), base("Lisbon", 4)]));
    expect(first.arrive).toEqual({ place: "Lisbon", mode: "ferry", detail: "2h" });
    expect(first.dayOuts).toEqual([]);
  });

  it("gives no stops to a listing with no bases", () => {
    expect(stopsOf(listing([hop("Somewhere")]))).toEqual([]);
  });

  it("gives every real listing's nights back in its stops", () => {
    for (const trip of PRESET_TRIPS) {
      expect(stopsOf(trip).reduce((n, s) => n + s.nights, 0), trip.id).toBe(trip.nights);
    }
  });
});
