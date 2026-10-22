import { describe, expect, it } from "vitest";

import { day } from "../detail/day";
import type { PresetDetail } from "../detail/preset-detail-types";
import { presetDetail } from "../detail/preset-details";
import type { PresetTrip } from "../preset-trip-types";
import { PRESET_TRIPS } from "../preset-trips";
import { copyPlan } from "./copy-plan";

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
  ],
  highlights: ["The Mezquita"],
  bestMonths: "April, May",
  interests: ["Food"],
  landscape: ["Coast"],
  effort: "Easy",
};

const detail: PresetDetail = {
  stops: [
    { place: "Seville", summary: "", days: [day("Arrive", ["15:00 The cathedral", "21:00 Tapas dinner in Triana"]), day("Free", ["10:00 ~ Free day."])] },
    { place: "Córdoba", summary: "", days: [day("To Córdoba", ["09:00 Train to Córdoba", "11:00 * The Mezquita"], "The Mezquita"), day("Home", ["12:00 Fly home"])] },
  ],
  inPlan: [],
  advice: [],
  goodToKnow: [],
  ideas: { atStops: [], otherStops: [] },
};

describe("copyPlan", () => {
  it("makes one day per date, from the start to the day everyone goes home", () => {
    const plan = copyPlan(trip, detail, "2027-04-01", { events: true });
    expect(plan.days.map((d) => d.date)).toEqual(["2027-04-01", "2027-04-02", "2027-04-03", "2027-04-04"]);
  });

  it("sleeps each night at its stop, in leg order", () => {
    const plan = copyPlan(trip, detail, "2027-04-01", { events: true });
    expect(plan.days.map((d) => plan.places[d.place].name)).toEqual(["Seville", "Seville", "Córdoba", "Córdoba"]);
    expect(plan.places[0]).toEqual({ name: "Seville", lat: 37.39, lng: -5.99, countryCode: "ES" });
  });

  it("makes the move between stops a transport event that takes the time of its line", () => {
    const [move] = copyPlan(trip, detail, "2027-04-01", { events: true }).days[2].events;
    expect(move).toEqual({ type: "transport", title: "Seville to Córdoba", time: "09:00", transportType: "train", note: "Train to Córdoba · 45 min" });
  });

  it("copies timed lines as events, meals as food, and leaves free time free", () => {
    const plan = copyPlan(trip, detail, "2027-04-01", { events: true });
    expect(plan.days[0].events.map((e) => [e.type, e.time, e.title])).toEqual([
      ["activity", "15:00", "The cathedral"],
      ["food", "21:00", "Tapas dinner in Triana"],
    ]);
    expect(plan.days[1].events).toEqual([]);
    expect(plan.days[2].events.map((e) => e.title)).toEqual(["Seville to Córdoba", "The Mezquita"]);
  });

  it("keeps the moves but no other events when events are off", () => {
    const plan = copyPlan(trip, detail, "2027-04-01", { events: false });
    expect(plan.days.flatMap((d) => d.events.map((e) => e.type))).toEqual(["transport"]);
  });

  it("makes a move with no line saying when an all-day event", () => {
    const [move] = copyPlan(trip, null, "2027-04-01", { events: true }).days[2].events;
    expect(move).toMatchObject({ type: "transport", time: null, note: "45 min" });
  });

  it("uses one place for a stop the listing comes back to", () => {
    const peru = PRESET_TRIPS.find((t) => t.id === "peru-sacred-valley")!;
    const plan = copyPlan(peru, presetDetail(peru.id), "2027-05-01", { events: false });
    expect(plan.places.filter((p) => p.name === "Cusco")).toHaveLength(1);
  });

  it("covers every night of every listing", () => {
    for (const listing of PRESET_TRIPS) {
      expect(copyPlan(listing, presetDetail(listing.id), "2027-01-01", { events: true }).days, listing.id).toHaveLength(listing.nights + 1);
    }
  });
});
