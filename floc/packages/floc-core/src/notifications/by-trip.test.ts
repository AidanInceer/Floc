import { describe, expect, it } from "vitest";

import { groupByTrip, lineUnderTrip, planFirst } from "./by-trip";

const item = (id: number, tripId: number | null, tripName: string | null) => ({ id, tripId, tripName });

describe("grouping the inbox by trip", () => {
  it("keeps newest-first order inside and between trips", () => {
    const groups = groupByTrip([item(5, 1, "Portugal"), item(4, 2, "Dolomites"), item(3, 1, "Portugal")]);
    expect(groups.map((g) => [g.tripName, g.items.map((i) => i.id)])).toEqual([
      ["Portugal", [5, 3]],
      ["Dolomites", [4]],
    ]);
  });

  it("puts what belongs to no trip last", () => {
    const groups = groupByTrip([item(5, null, null), item(4, 1, "Portugal")]);
    expect(groups.map((g) => g.tripName)).toEqual(["Portugal", null]);
  });
});

describe("the order inside a trip", () => {
  it("puts plan changes first, in trip order, then the rest as they came", () => {
    const rows = [
      { id: 1, change: null },
      { id: 2, change: { date: "2027-01-05", time: "10:30" } },
      { id: 3, change: null },
      { id: 4, change: { date: "2026-12-31", time: "20:30" } },
    ];
    expect(planFirst(rows).map((r) => r.id)).toEqual([4, 2, 1, 3]);
  });
});

describe("a line under its trip's name", () => {
  it.each([
    ["Priya moved Dinner on Portugal", "Priya moved Dinner"],
    ["Sam added Hotel.pdf to Portugal", "Sam added Hotel.pdf"],
    ["Maya removed Tram 28 from Portugal", "Maya removed Tram 28"],
    ["Sam changed the dates of Portugal", "Sam changed the dates"],
    ["Maya joined Portugal", "Maya joined"],
    ["Ada nudged you to pack on the trip Portugal", "Ada nudged you to pack"],
    ["You still owe £5.00 for Portugal", "You still owe £5.00"],
    ["Priya nudged you about Portugal", "Priya nudged you"],
    ["One year ago today: Portugal", "One year ago today"],
  ])("%s", (text, short) => {
    expect(lineUnderTrip(text, "Portugal")).toBe(short);
  });

  it("leaves a line alone when the trip is not at its end", () => {
    expect(lineUnderTrip("Portugal starts today", "Portugal")).toBe("Portugal starts today");
    expect(lineUnderTrip("Sam sent you a friend request", null)).toBe("Sam sent you a friend request");
  });
});
