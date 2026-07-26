import { describe, expect, it } from "vitest";

import { deriveStops, type StopDayInput } from "./stops";

function day(
  dayId: number,
  date: string,
  overnightPlaceId: number | null,
  overnightPlaceName: string | null = null,
): StopDayInput {
  return { dayId, date, overnightPlaceId, overnightPlaceName };
}

describe("deriveStops", () => {
  it("returns [] for an empty list", () => {
    expect(deriveStops([])).toEqual([]);
  });

  it("groups a single run into one stop", () => {
    const days = [
      day(1, "2026-06-01", 10, "Rome"),
      day(2, "2026-06-02", 10, "Rome"),
      day(3, "2026-06-03", 10, "Rome"),
    ];
    const stops = deriveStops(days);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toMatchObject({
      placeId: 10,
      placeName: "Rome",
      startDate: "2026-06-01",
      endDate: "2026-06-03",
      nights: 3,
      dayIds: [1, 2, 3],
    });
  });

  it("splits into two stops when the overnight place changes", () => {
    const days = [
      day(1, "2026-06-01", 10, "Rome"),
      day(2, "2026-06-02", 10, "Rome"),
      day(3, "2026-06-03", 20, "Florence"),
    ];
    const stops = deriveStops(days);
    expect(stops).toHaveLength(2);
    expect(stops[0]).toMatchObject({ placeId: 10, dayIds: [1, 2] });
    expect(stops[1]).toMatchObject({ placeId: 20, dayIds: [3] });
  });

  it("treats a non-contiguous return to the same place as TWO stops", () => {
    const days = [
      day(1, "2026-06-01", 10, "Rome"),
      day(2, "2026-06-02", 20, "Florence"),
      day(3, "2026-06-03", 10, "Rome"),
    ];
    const stops = deriveStops(days);
    expect(stops).toHaveLength(3);
    expect(stops[0]).toMatchObject({ placeId: 10, dayIds: [1] });
    expect(stops[1]).toMatchObject({ placeId: 20, dayIds: [2] });
    expect(stops[2]).toMatchObject({ placeId: 10, dayIds: [3] });
  });

  it("groups consecutive days with a null overnight place into their own stop", () => {
    const days = [
      day(1, "2026-06-01", null, null),
      day(2, "2026-06-02", null, null),
      day(3, "2026-06-03", 10, "Rome"),
    ];
    const stops = deriveStops(days);
    expect(stops).toHaveLength(2);
    expect(stops[0]).toMatchObject({ placeId: null, dayIds: [1, 2] });
    expect(stops[1]).toMatchObject({ placeId: 10, dayIds: [3] });
  });

  it("treats non-adjacent null runs as separate stops too", () => {
    const days = [
      day(1, "2026-06-01", null, null),
      day(2, "2026-06-02", 10, "Rome"),
      day(3, "2026-06-03", null, null),
    ];
    const stops = deriveStops(days);
    expect(stops).toHaveLength(3);
    expect(stops[0].placeId).toBeNull();
    expect(stops[1].placeId).toBe(10);
    expect(stops[2].placeId).toBeNull();
  });
});
