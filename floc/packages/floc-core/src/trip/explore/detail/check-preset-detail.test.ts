import { describe, expect, it } from "vitest";

import type { PresetTrip } from "../preset-trip-types";
import { checkPresetDetail } from "./check-preset-detail";
import type { PresetDay, PresetDetail } from "./preset-detail-types";

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
  highlights: [],
  bestMonths: "April, May",
};

const day = (title = "A day"): PresetDay => ({ title, items: [{ time: "09:00", text: "Breakfast" }, { time: "13:30", text: "Lunch" }] });

const good: PresetDetail = {
  stops: [
    { place: "Seville", summary: "Tiles and tapas.", days: [day(), day()] },
    { place: "Córdoba", summary: "One mosque.", days: [day(), day()] },
  ],
  inPlan: [{ value: "8", label: "places, with times" }],
  advice: [{ topic: "money", title: "Money", lines: ["Carry some cash."] }],
  goodToKnow: [{ label: "Pace", text: "Slow." }],
};

const withStops = (stops: PresetDetail["stops"]): PresetDetail => ({ ...good, stops });

describe("checkPresetDetail", () => {
  it("passes a detail that fits its listing", () => {
    expect(checkPresetDetail(trip, good)).toEqual([]);
  });

  it("wants one stop per base", () => {
    expect(checkPresetDetail(trip, withStops([good.stops[0]]))).toEqual(["2 bases in the listing, 1 stops written"]);
  });

  it("wants each stop named as its base", () => {
    const problems = checkPresetDetail(trip, withStops([good.stops[0], { ...good.stops[1], place: "Granada" }]));
    expect(problems).toEqual(['stop 2 is "Granada", the listing says "Córdoba"']);
  });

  it("wants a day per night, and one more on the last stop for the way home", () => {
    const problems = checkPresetDetail(
      trip,
      withStops([{ ...good.stops[0], days: [day()] }, { ...good.stops[1], days: [day()] }]),
    );
    expect(problems).toEqual(["Seville has 1 days, wants 2", "Córdoba has 1 days, wants 2"]);
  });

  it("wants a title and at least one line on every day", () => {
    const empty: PresetDay = { title: " ", items: [] };
    const problems = checkPresetDetail(trip, withStops([{ ...good.stops[0], days: [empty, day()] }, good.stops[1]]));
    expect(problems).toEqual(["day 1 has no title", "day 1 has nothing in it"]);
  });

  it("wants 24-hour times that run forward through the day", () => {
    const bad: PresetDay = { title: "Back to front", items: [{ time: "9am", text: "x" }, { time: "14:00", text: "x" }, { time: "11:00", text: "x" }] };
    const problems = checkPresetDetail(trip, withStops([{ ...good.stops[0], days: [bad, day()] }, good.stops[1]]));
    expect(problems).toEqual(['day 1: "9am" is not HH:MM', "day 1: 11:00 comes after 14:00"]);
  });

  it("wants a summary on every stop", () => {
    expect(checkPresetDetail(trip, withStops([{ ...good.stops[0], summary: "" }, good.stops[1]]))).toEqual(["Seville has no summary"]);
  });

  it("wants one to four plan figures", () => {
    const figure = good.inPlan[0];
    expect(checkPresetDetail(trip, { ...good, inPlan: [] })).toEqual(["0 plan figures, wants 1 to 4"]);
    expect(checkPresetDetail(trip, { ...good, inPlan: [figure, figure, figure, figure, figure] })).toEqual(["5 plan figures, wants 1 to 4"]);
  });

  it("rejects advice with no lines and facts the listing already gives", () => {
    const problems = checkPresetDetail(trip, {
      ...good,
      advice: [{ topic: "money", title: "Money", lines: [] }],
      goodToKnow: [{ label: "Cost", text: "Cheap." }],
    });
    expect(problems).toEqual(['advice "Money" has no lines', '"Cost" comes from the listing, do not repeat it']);
  });
});
