import { describe, expect, it } from "vitest";

import type { PresetTrip } from "../preset-trip-types";
import type { PresetDetail } from "./preset-detail-types";
import { buildPresetPlan } from "./preset-plan";

const trip: PresetTrip = {
  id: "two-towns",
  title: "Two towns",
  operator: "Floc editorial",
  region: "Europe",
  country: "Spain",
  nights: 3,
  groupSize: "2–4 people",
  priceFromMinor: 45000,
  currency: "EUR",
  summary: "Two towns by train.",
  legs: [
    { kind: "base", place: "Seville", nights: 2, lat: 37.39, lng: -5.99 },
    { kind: "hop", place: "Córdoba", mode: "train", detail: "45 min" },
    { kind: "base", place: "Córdoba", nights: 1, lat: 37.88, lng: -4.78 },
    { kind: "hop", place: "Medina Azahara", mode: "car", detail: "day trip" },
  ],
  highlights: ["The Mezquita"],
  bestMonths: "April, May",
};

const day = (title: string, highlight?: string) => ({ title, items: [{ time: "10:00", text: title }], ...(highlight ? { highlight } : {}) });

const detail: PresetDetail = {
  stops: [
    { place: "Seville", summary: "Tiles and tapas.", days: [day("Arrive"), day("The Alcázar", "The Alcázar at opening")] },
    { place: "Córdoba", summary: "One mosque, one patio.", days: [day("The Mezquita", "The Mezquita"), day("Home")] },
  ],
  inPlan: [{ value: "9", label: "places, with times" }],
  advice: [{ topic: "money", title: "Money", lines: ["Carry some cash."] }],
  goodToKnow: [{ label: "Pace", text: "Slow." }],
};

describe("buildPresetPlan without detail", () => {
  const plan = buildPresetPlan(trip, null);

  it("makes one stop per base, numbered from 1", () => {
    expect(plan.stops.map((s) => [s.no, s.place, s.nights])).toEqual([
      [1, "Seville", 2],
      [2, "Córdoba", 1],
    ]);
  });

  it("puts the hop before a base on that base as its arrival", () => {
    expect(plan.stops[0].arrive).toBeNull();
    expect(plan.stops[1].arrive).toEqual({ mode: "train", detail: "45 min", from: "Seville", via: null });
  });

  it("keeps a hop with no base after it as a side trip of the stop before", () => {
    expect(plan.stops[1].sideTrips).toEqual(["Medina Azahara · day trip"]);
  });

  it("has no days, summaries or advice, and says so", () => {
    expect(plan.detailed).toBe(false);
    expect(plan.dayCount).toBe(0);
    expect(plan.stops.every((s) => s.days.length === 0 && s.summary === null)).toBe(true);
    expect(plan.advice).toEqual([]);
  });

  it("derives the plan figures from the legs", () => {
    expect(plan.inPlan).toEqual([
      { value: "3", label: "nights" },
      { value: "2", label: "stops" },
      { value: "1", label: "ride between stops" },
    ]);
  });

  it("derives group, season and cost for good to know", () => {
    expect(plan.goodToKnow).toEqual([
      { label: "Group", text: "2–4 people" },
      { label: "Best in", text: "April, May" },
      { label: "Cost", text: "From €450.00 each. Nothing is booked for you." },
    ]);
  });
});

describe("buildPresetPlan with detail", () => {
  const plan = buildPresetPlan(trip, detail);

  it("numbers the days straight through the stops", () => {
    expect(plan.dayCount).toBe(4);
    expect(plan.stops.map((s) => s.days.map((d) => d.n))).toEqual([[1, 2], [3, 4]]);
  });

  it("lists each stop's highlights in day order", () => {
    expect(plan.stops[0].highlights).toEqual(["The Alcázar at opening"]);
    expect(plan.stops[1].highlights).toEqual(["The Mezquita"]);
  });

  it("uses the written figures, and puts written facts before the derived ones", () => {
    expect(plan.detailed).toBe(true);
    expect(plan.inPlan).toEqual(detail.inPlan);
    expect(plan.goodToKnow.map((f) => f.label)).toEqual(["Pace", "Group", "Best in", "Cost"]);
    expect(plan.advice).toEqual(detail.advice);
  });

  it("names a place the ride passes when it is not the next base", () => {
    const legs: PresetTrip["legs"] = [trip.legs[0], { kind: "hop", place: "Sierra Morena", mode: "car", detail: "2h" }, trip.legs[2]];
    expect(buildPresetPlan({ ...trip, legs }, null).stops[1].arrive?.via).toBe("Sierra Morena");
  });

  it("keeps both of two hops in a row: the first as a side trip, the second as the ride", () => {
    const legs: PresetTrip["legs"] = [trip.legs[0], { kind: "hop", place: "Itálica", mode: "car", detail: "half day" }, trip.legs[1], trip.legs[2]];
    const stops = buildPresetPlan({ ...trip, legs }, null).stops;
    expect(stops[0].sideTrips).toEqual(["Itálica · half day"]);
    expect(stops[1].arrive?.detail).toBe("45 min");
  });

  it("ignores a hop before the first base", () => {
    const legs: PresetTrip["legs"] = [{ kind: "hop", place: "Seville", mode: "flight", detail: "2h" }, ...trip.legs];
    expect(buildPresetPlan({ ...trip, legs }, null).stops[0].arrive).toBeNull();
  });

  it("drops the days of a stop whose place does not match its base", () => {
    const wrong = { ...detail, stops: [detail.stops[0], { ...detail.stops[1], place: "Granada" }] };
    const stops = buildPresetPlan(trip, wrong).stops;
    expect(stops[0].days).toHaveLength(2);
    expect(stops[1].days).toEqual([]);
    expect(stops[1].summary).toBeNull();
  });
});
