import { describe, expect, it } from "vitest";

import { tripShape } from "./trip-shape";

const day = (date: string, place: [number, string, string, number, number] | null) => ({
  dayId: Number(date.slice(8)),
  date,
  overnightPlaceId: place?.[0] ?? null,
  placeName: place?.[1] ?? null,
  countryCode: place?.[2] ?? null,
  lat: place?.[3] ?? null,
  lng: place?.[4] ?? null,
});
const lisbon: [number, string, string, number, number] = [1, "Lisbon", "PT", 38.72, -9.14];
const porto: [number, string, string, number, number] = [2, "Porto", "PT", 41.15, -8.61];

describe("tripShape", () => {
  it("counts nights from the trip's dates and stops from its days", () => {
    const shape = tripShape({
      start: "2026-09-12",
      end: "2026-09-15",
      days: [day("2026-09-12", lisbon), day("2026-09-13", lisbon), day("2026-09-14", porto), day("2026-09-15", porto)],
      chosenNights: 9,
    });
    expect(shape.nights).toEqual({ count: 3, from: "dates" });
    expect(shape.stops.map((s) => [s.name, s.nights])).toEqual([["Lisbon", 2], ["Porto", 1]]);
  });

  it("counts nights from the days when the trip has no dates", () => {
    const shape = tripShape({ start: null, end: null, days: [day("2026-09-12", lisbon), day("2026-09-13", lisbon), day("2026-09-14", lisbon)], chosenNights: null });
    expect(shape.nights).toEqual({ count: 2, from: "days" });
  });

  it("takes the member's nights, else seven, when there are no days to count", () => {
    expect(tripShape({ start: null, end: null, days: [], chosenNights: 4 }).nights).toEqual({ count: 4, from: "chosen" });
    expect(tripShape({ start: null, end: null, days: [], chosenNights: null }).nights).toEqual({ count: 7, from: "assumed" });
  });

  it("leaves out days with nowhere to sleep yet", () => {
    const shape = tripShape({ start: null, end: null, days: [day("2026-09-12", null), day("2026-09-13", null)], chosenNights: null });
    expect(shape.stops).toEqual([]);
  });
});
