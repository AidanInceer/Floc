import { describe, expect, it } from "vitest";

import { visitsOf } from "./route-visits";

const stop = (no: number, name: string, days: number, lat: number, lng: number) => ({ no, name, days, lat, lng });

describe("visitsOf", () => {
  it("gives each place one visit, in the order the route first reaches it", () => {
    const stops = [stop(1, "Hanoi", 3, 21, 105), stop(2, "Hội An", 4, 15, 108)];
    expect(visitsOf(stops).map((v) => v.label)).toEqual(["1", "2"]);
  });

  it("folds a return to a place into its first visit", () => {
    const stops = [stop(1, "Puerto Natales", 2, -51.7, -72.5), stop(2, "Refugios", 4, -51, -73), stop(3, "Puerto Natales", 3, -51.7, -72.5)];
    const visits = visitsOf(stops);
    expect(visits.map((v) => v.label)).toEqual(["1·3", "2"]);
    expect(visits[0]?.days).toBe("2 + 3 days");
  });

  it("says which visit each stop belongs to", () => {
    const stops = [stop(1, "A", 1, 0, 0), stop(2, "B", 1, 1, 1), stop(3, "A", 1, 0, 0)];
    expect(visitsOf(stops).map((v) => v.stops)).toEqual([[0, 2], [1]]);
  });

  it("spells a single day as a day", () => {
    expect(visitsOf([stop(1, "A", 1, 0, 0)])[0]?.days).toBe("1 day");
  });
});
