import { describe, expect, it } from "vitest";

import { defineTrip } from "./define-trip";

describe("defineTrip", () => {
  it("counts the nights from the bases, not the hops", () => {
    const trip = defineTrip({
      id: "t", title: "T", operator: "Floc editorial", region: "Europe", country: "France", groupSize: "2–6 people",
      priceFromMinor: 1000, currency: "EUR", summary: "", highlights: [], bestMonths: "May", interests: [], landscape: [], effort: "Easy",
      legs: [
        { kind: "base", place: "A", nights: 2, lat: 0, lng: 0 },
        { kind: "hop", place: "B", mode: "train", detail: "1h" },
        { kind: "base", place: "B", nights: 3, lat: 0, lng: 0 },
      ],
    });
    expect(trip.nights).toBe(5);
  });
});
