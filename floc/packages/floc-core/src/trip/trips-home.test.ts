import { describe, expect, it } from "vitest";

import { arrangeTripsHome } from "./trips-home";

type Trip = { id: number; startDate: string | null };

describe("arrangeTripsHome", () => {
  it("features the earliest dated trip while keeping the other trip order", () => {
    const trips: Trip[] = [
      { id: 1, startDate: "2027-06-01" },
      { id: 2, startDate: null },
      { id: 3, startDate: "2026-11-01" },
      { id: 4, startDate: "2027-02-01" },
    ];

    expect(arrangeTripsHome(trips)).toEqual({
      featured: trips[2],
      later: [trips[0], trips[3]],
      undated: [trips[1]],
    });
    expect(trips.map((trip) => trip.id)).toEqual([1, 2, 3, 4]);
  });

  it("keeps undated trips visible when no trip has a start date", () => {
    const trips: Trip[] = [{ id: 1, startDate: null }];

    expect(arrangeTripsHome(trips)).toEqual({
      featured: null,
      later: [],
      undated: trips,
    });
  });
});
