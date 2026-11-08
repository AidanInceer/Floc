import { describe, expect, it } from "vitest";

import { deriveStops, nightsLabel, placedStops, type StopDayInput } from "./stops";

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
      nights: 2,
      dayIds: [1, 2, 3],
    });
  });

  it("counts no night on the trip's last day, the day home, as the Dates page does", () => {
    const stops = deriveStops([
      day(1, "2026-10-24", 10, "Lisbon"),
      day(2, "2026-10-25", 20, "Lagos"),
      day(3, "2026-10-26", 20, "Lagos"),
      day(4, "2026-10-27", 20, "Lagos"),
    ]);
    expect(stops.map((s) => s.nights)).toEqual([1, 2]);
  });

  it("keeps the last stop's night when the trip's end date has no day row", () => {
    const days = [
      day(1, "2027-05-01", 10, "Hiroshima"),
      day(2, "2027-05-02", 10, "Hiroshima"),
      day(3, "2027-05-03", 20, "Osaka"),
    ];
    expect(deriveStops(days, "2027-05-04").map((s) => s.nights)).toEqual([2, 1]);
  });

  it("takes the day home off the last stop when that day has its row", () => {
    const days = [day(1, "2027-05-03", 20, "Osaka"), day(2, "2027-05-04", 20, "Osaka")];
    expect(deriveStops(days, "2027-05-04").map((s) => s.nights)).toEqual([1]);
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

describe("placedStops", () => {
  it("drops the undecided runs, in order", () => {
    const stops = deriveStops([
      day(1, "2026-09-01", 10, "Barcelona"),
      day(2, "2026-09-02", 10, "Barcelona"),
      day(3, "2026-09-03", null, null),
      day(4, "2026-09-04", 20, "Madrid"),
    ]);
    expect(placedStops(stops).map((s) => s.placeName)).toEqual([
      "Barcelona",
      "Madrid",
    ]);
  });

  it("is empty when nothing has an overnight place", () => {
    const stops = deriveStops([
      day(1, "2026-09-01", null, null),
      day(2, "2026-09-02", null, null),
    ]);
    expect(placedStops(stops)).toEqual([]);
  });
});

describe("nightsLabel", () => {
  it("names a stop by its nights, and a stop on the last day only as the day home", () => {
    expect([0, 1, 4].map(nightsLabel)).toEqual(["Day home", "1 night", "4 nights"]);
  });
});
