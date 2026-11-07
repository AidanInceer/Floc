import { describe, expect, it } from "vitest";

import { routesByTrip, type TripHop, type TripRouteDay } from "./routes-by-trip";

const day = (tripId: number, dayId: number, date: string, place: [number, string, number, number, string] | null): TripRouteDay => ({
  tripId,
  dayId,
  date,
  overnightPlaceId: place?.[0] ?? null,
  placeName: place?.[1] ?? null,
  lat: place?.[2] ?? null,
  lng: place?.[3] ?? null,
  countryCode: place?.[4] ?? null,
});

const PORTO: [number, string, number, number, string] = [1, "Porto", 41.15, -8.63, "PT"];
const LISBON: [number, string, number, number, string] = [2, "Lisbon", 38.72, -9.14, "PT"];
const DIEPPE: [number, string, number, number, string] = [3, "Dieppe", 49.92, 1.08, "FR"];

describe("routesByTrip", () => {
  it("builds each trip's route from its own days only", () => {
    const routes = routesByTrip(
      [
        day(7, 1, "2027-05-01", PORTO),
        day(7, 2, "2027-05-02", PORTO),
        day(7, 3, "2027-05-03", LISBON),
        day(7, 4, "2027-05-04", null),
        day(9, 5, "2027-05-28", DIEPPE),
        day(9, 6, "2027-05-29", null),
      ],
      [],
    );
    expect(routes.get(7)?.stops.map((s) => s.place)).toEqual(["Porto", "Lisbon"]);
    expect(routes.get(9)?.stops.map((s) => s.place)).toEqual(["Dieppe"]);
    expect(routes.get(7)?.countries).toEqual(["PT"]);
  });

  it("reads how each leg travels from that trip's transport", () => {
    const hops: TripHop[] = [{ tripId: 7, dayId: 3, mode: "train", time: "09:00", endTime: "12:15" }];
    const routes = routesByTrip([day(7, 1, "2027-05-01", PORTO), day(7, 3, "2027-05-03", LISBON), day(7, 4, "2027-05-04", null)], hops);
    expect(routes.get(7)?.moves).toEqual([{ mode: "train", time: "3h 15" }]);
  });

  it("orders a trip's days by date, whatever order they arrive in", () => {
    const routes = routesByTrip([day(7, 3, "2027-05-03", LISBON), day(7, 1, "2027-05-01", PORTO), day(7, 4, "2027-05-04", null)], []);
    expect(routes.get(7)?.stops.map((s) => s.place)).toEqual(["Porto", "Lisbon"]);
  });

  it("leaves a trip with no days out of the map", () => {
    expect(routesByTrip([], []).size).toBe(0);
  });
});
