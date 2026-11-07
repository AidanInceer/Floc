import type { DayEvent, ItineraryDay, TripPlace } from "@floc/api/port";
import { describe, expect, it } from "vitest";

import { routeOf } from "./overview-route";

const places: TripPlace[] = [
  { id: 1, name: "Lisbon, Portugal", lat: 38.72, lng: -9.14, countryCode: "PT" },
  { id: 2, name: "Lagos, Portugal", lat: 37.1, lng: -8.67, countryCode: "PT" },
  { id: 3, name: "Nowhere", lat: null, lng: null, countryCode: null },
];
const train = (dayId: number, time: string | null, endTime: string | null): DayEvent => ({
  id: dayId * 10, dayId, orderIndex: 0, type: "transport", title: null, transportType: "train",
  time, endTime, allDay: false, note: null, placeName: null,
});
const day = (id: number, place: number | null, events: DayEvent[] = []): ItineraryDay => ({
  id, date: `2026-12-${String(14 + id).padStart(2, "0")}`, overnightPlaceId: place, overnightPlaceName: null, events,
});

describe("routeOf", () => {
  it("pins each leg from its place and times the hop from the day's first journey", () => {
    const legs = [
      { placeId: 1, placeName: "Lisbon, Portugal", days: [{ dayId: 1 }], nights: 3, mode: null },
      { placeId: 2, placeName: "Lagos, Portugal", days: [{ dayId: 2 }], nights: 4, mode: "train" as const },
    ];
    const route = routeOf(legs, [day(1, 1), day(2, 2, [train(2, "10:00", "13:05")])], places);
    expect(route.stops.map((s) => s.place)).toEqual(["Lisbon, Portugal", "Lagos, Portugal"]);
    expect(route.moves).toEqual([{ mode: "train", time: "3h 05" }]);
    expect(route.countries).toEqual(["PT"]);
  });

  it("names a leg whose place has no pin rather than dropping it", () => {
    const legs = [{ placeId: 3, placeName: "Nowhere", days: [{ dayId: 1 }], nights: 1, mode: null }];
    expect(routeOf(legs, [day(1, 3)], places).missing).toEqual(["Nowhere"]);
  });
});
