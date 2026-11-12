import { describe, expect, it } from "vitest";

import { recapCard, recapShows } from "./recap";

describe("recapShows", () => {
  it("shows from the day after the end date (rule 4)", () => {
    expect(recapShows("2026-09-28", "2026-09-29")).toBe(true);
  });

  it("does not show on the last day or before it", () => {
    expect(recapShows("2026-09-28", "2026-09-28")).toBe(false);
    expect(recapShows("2026-09-28", "2026-09-20")).toBe(false);
  });

  it("does not show for an undated trip (rule 9)", () => {
    expect(recapShows(null, "2026-09-29")).toBe(false);
  });
});

describe("recapCard", () => {
  const stops = [
    { place: "Palermo", nights: 3 },
    { place: "Cefalù", nights: 2 },
    { place: "Palermo", nights: 1 },
  ];

  it("holds the name, the month, each stop numbered with its nights, and the count", () => {
    expect(recapCard({ name: "Sicily", startDate: "2026-09-19", endDate: "2026-09-28", stops })).toEqual({
      name: "Sicily",
      month: "September 2026",
      stops: [
        { no: 1, place: "Palermo", nights: 3 },
        { no: 2, place: "Cefalù", nights: 2 },
        { no: 3, place: "Palermo", nights: 1 },
      ],
      foot: "9 nights · 2 places",
    });
  });

  it("names both months when the trip runs over the turn of one", () => {
    expect(recapCard({ name: "Alps", startDate: "2026-12-28", endDate: "2027-01-03", stops: [] }).month).toBe("December 2026 – January 2027");
    expect(recapCard({ name: "Rome", startDate: "2026-09-28", endDate: "2026-10-02", stops: [] }).month).toBe("September – October 2026");
  });

  it("says one night and one place in the singular", () => {
    expect(recapCard({ name: "Bath", startDate: "2026-09-19", endDate: "2026-09-20", stops: [{ place: "Bath", nights: 1 }] }).foot).toBe("1 night · 1 place");
  });

  it("holds no money and no people", () => {
    const card = recapCard({ name: "Sicily", startDate: "2026-09-19", endDate: "2026-09-28", stops });
    expect(Object.keys(card).sort()).toEqual(["foot", "month", "name", "stops"]);
  });
});
