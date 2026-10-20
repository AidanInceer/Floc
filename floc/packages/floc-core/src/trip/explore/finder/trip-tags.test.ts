import { describe, expect, it } from "vitest";

import { PRESET_TRIPS, type PresetTrip } from "../preset-trips";
import { tagsOf } from "./trip-tags";

type Leg = PresetTrip["legs"][number];
const base = (place: string, nights: number): Leg => ({ kind: "base", place, nights, lat: 0, lng: 0 });
const hop = (place: string, mode: "car" | "train" | "ferry" | "flight"): Leg => ({ kind: "hop", place, mode, detail: "2h" });
const listing = (legs: Leg[], over: Partial<PresetTrip> = {}): PresetTrip => ({
  ...PRESET_TRIPS[0],
  interests: ["Food"],
  landscape: ["Coast"],
  effort: "Easy",
  nights: legs.reduce((n, l) => n + (l.kind === "base" ? l.nights : 0), 0),
  legs,
  ...over,
});

describe("tagsOf", () => {
  it("starts with what the listing says it is for, then where it goes and how hard it is", () => {
    const trip = listing([base("Lisbon", 10)], { interests: ["Food", "Cities"], landscape: ["Coast"], effort: "Moderate" });
    expect(tagsOf(trip)).toEqual(["Food", "Cities", "Coast", "Slow", "Moderate"]);
  });

  it("counts a mode as a way of getting around after two moves by it", () => {
    const trip = listing([base("A", 3), hop("B", "train"), base("B", 3), hop("C", "train"), base("C", 4)]);
    expect(tagsOf(trip)).toContain("Rail");
    const once = listing([base("A", 5), hop("B", "train"), base("B", 5)]);
    expect(tagsOf(once)).not.toContain("Rail");
  });

  it("calls it a road trip when most moves are by car, even a few", () => {
    const trip = listing([base("A", 4), hop("B", "car"), base("B", 4)]);
    expect(tagsOf(trip)).toContain("Road trip");
  });

  it("leaves out a day trip at the end, which goes nowhere new", () => {
    const trip = listing([base("A", 5), hop("B", "ferry"), base("B", 5), hop("C", "ferry")]);
    expect(tagsOf(trip)).not.toContain("Boats");
  });

  it("reads the pace from how often the group moves on in a week", () => {
    const route = (stops: number, each: number) => {
      const legs: Leg[] = [base("S0", each)];
      for (let i = 1; i < stops; i++) legs.push(hop(`S${i}`, "car"), base(`S${i}`, each));
      return listing(legs);
    };
    expect(tagsOf(route(2, 5))).toContain("Slow");
    expect(tagsOf(route(4, 2))).toContain("Steady");
    expect(tagsOf(route(6, 2))).toContain("On the move");
  });

  it("gives every listing a pace and an effort", () => {
    for (const trip of PRESET_TRIPS) {
      const tags = tagsOf(trip);
      expect(tags.filter((t) => ["Slow", "Steady", "On the move"].includes(t))).toHaveLength(1);
      expect(tags).toContain(trip.effort);
    }
  });
});
