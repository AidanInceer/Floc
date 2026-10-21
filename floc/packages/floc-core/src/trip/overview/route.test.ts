import { describe, expect, it } from "vitest";

import { hopLength, overviewRoute, type RouteDayPin } from "./route";

const leg = (no: number, placeId: number, placeName: string, firstDay: number, mode: "train" | "car" | "flight" | null = null) => ({
  no,
  placeId,
  placeName,
  days: [{ dayId: firstDay }],
  mode,
});

const pin = (overnightPlaceId: number, lat: number | null, lng: number | null, countryCode: string | null = null): RouteDayPin => ({
  overnightPlaceId,
  lat,
  lng,
  countryCode,
});

const PORTO = pin(1, 41.15, -8.63, "PT");
const LISBON = pin(2, 38.72, -9.14, "PT");
const SEVILLE = pin(3, 37.39, -5.98, "ES");

describe("overviewRoute", () => {
  it("puts every leg with a pin on the route, in order", () => {
    const route = overviewRoute({
      legs: [leg(1, 1, "Porto", 10), leg(2, 2, "Lisbon", 12, "train")],
      days: [PORTO, LISBON],
      hops: new Map(),
    });

    expect(route.stops).toEqual([
      { place: "Porto", lat: 41.15, lng: -8.63 },
      { place: "Lisbon", lat: 38.72, lng: -9.14 },
    ]);
  });

  it("names a leg with no pin instead of drawing it (rule 11)", () => {
    const route = overviewRoute({
      legs: [leg(1, 1, "Porto", 10), leg(2, 9, "Tia Rosa's", 12), leg(3, 2, "Lisbon", 14, "car")],
      days: [PORTO, pin(9, null, null), LISBON],
      hops: new Map(),
    });

    expect(route.stops.map((s) => s.place)).toEqual(["Porto", "Lisbon"]);
    expect(route.missing).toEqual(["Tia Rosa's"]);
  });

  it("travels to each stop the way its first day's transport says", () => {
    const route = overviewRoute({
      legs: [leg(1, 1, "Porto", 10), leg(2, 2, "Lisbon", 12, "train")],
      days: [PORTO, LISBON],
      hops: new Map(),
    });

    expect(route.moves).toEqual([{ mode: "train", time: "" }]);
  });

  it("says a leg with no transport event is not set yet", () => {
    const route = overviewRoute({
      legs: [leg(1, 1, "Porto", 10), leg(2, 2, "Lisbon", 12)],
      days: [PORTO, LISBON],
      hops: new Map(),
    });

    expect(route.moves).toEqual([{ mode: null, time: "Not set" }]);
  });

  it("writes how long the journey takes when its event has a start and an end", () => {
    const route = overviewRoute({
      legs: [leg(1, 1, "Porto", 10), leg(2, 2, "Lisbon", 12, "train")],
      days: [PORTO, LISBON],
      hops: new Map([[12, { time: "09:10", endTime: "12:05" }]]),
    });

    expect(route.moves[0]).toEqual({ mode: "train", time: "2h 55" });
  });

  it("joins the stops either side of a leg with no pin, travelling as you reach the next one", () => {
    const route = overviewRoute({
      legs: [leg(1, 1, "Porto", 10), leg(2, 9, "Tia Rosa's", 12, "car"), leg(3, 2, "Lisbon", 14, "train")],
      days: [PORTO, pin(9, null, null), LISBON],
      hops: new Map(),
    });

    expect(route.moves).toEqual([{ mode: "train", time: "" }]);
  });

  it("collects each country the pinned stops stand in, once", () => {
    const route = overviewRoute({
      legs: [leg(1, 1, "Porto", 10), leg(2, 2, "Lisbon", 12), leg(3, 3, "Seville", 14)],
      days: [PORTO, LISBON, SEVILLE],
      hops: new Map(),
    });

    expect(route.countries).toEqual(["PT", "ES"]);
  });

  it("hands back the stops whose place has no country, for the map to look up", () => {
    const route = overviewRoute({
      legs: [leg(1, 1, "Porto", 10), leg(2, 2, "Lisbon", 12)],
      days: [PORTO, pin(2, 38.72, -9.14)],
      hops: new Map(),
    });

    expect(route.countries).toEqual(["PT"]);
    expect(route.uncoded).toEqual([{ lat: 38.72, lng: -9.14 }]);
  });

  it("has no moves for a trip with one stop", () => {
    const route = overviewRoute({ legs: [leg(1, 1, "Porto", 10)], days: [PORTO], hops: new Map() });

    expect(route.moves).toEqual([]);
    expect(route.outs).toEqual([]);
  });
});

describe("hopLength", () => {
  it("writes minutes under an hour as minutes", () => {
    expect(hopLength("10:00", "10:45")).toBe("45 min");
  });

  it("writes whole hours alone", () => {
    expect(hopLength("08:00", "11:00")).toBe("3h");
  });

  it("writes the minutes past an hour in two figures", () => {
    expect(hopLength("08:00", "12:05")).toBe("4h 05");
  });

  it("carries a journey past midnight into the next day", () => {
    expect(hopLength("22:30", "07:10")).toBe("8h 40");
  });

  it("says nothing without both times, or when they are the same", () => {
    expect(hopLength("09:00", null)).toBe("");
    expect(hopLength(null, "09:00")).toBe("");
    expect(hopLength("09:00", "09:00")).toBe("");
  });
});
