import { describe, expect, it } from "vitest";

import { forecastTitle, placeForEachNight, stopStarts } from "./forecast-stops";

const lisbon = { id: 1, name: "Lisbon, Portugal" };
const porto = { id: 2, name: "Porto, Portugal" };

describe("placeForEachNight", () => {
  it("gives every night of a one-stop trip that stop", () => {
    const nights = placeForEachNight([
      { date: "2026-11-22", place: lisbon },
      { date: "2026-11-23", place: lisbon },
    ]);
    expect([...nights.values()]).toEqual([lisbon, lisbon]);
  });

  it("gives each night the stop the group sleeps at that night", () => {
    const nights = placeForEachNight([
      { date: "2026-11-22", place: lisbon },
      { date: "2026-11-23", place: porto },
    ]);
    expect(nights.get("2026-11-22")).toBe(lisbon);
    expect(nights.get("2026-11-23")).toBe(porto);
  });

  it("carries the most recent stop over nights with no place", () => {
    const nights = placeForEachNight([
      { date: "2026-11-22", place: lisbon },
      { date: "2026-11-23", place: null },
      { date: "2026-11-24", place: porto },
      { date: "2026-11-25", place: null },
    ]);
    expect(nights.get("2026-11-23")).toBe(lisbon);
    expect(nights.get("2026-11-25")).toBe(porto);
  });

  it("gives nights before the first stop the first stop", () => {
    const nights = placeForEachNight([
      { date: "2026-11-22", place: null },
      { date: "2026-11-23", place: porto },
    ]);
    expect(nights.get("2026-11-22")).toBe(porto);
  });

  it("gives nothing when no night has a place", () => {
    expect(placeForEachNight([{ date: "2026-11-22", place: null }]).size).toBe(0);
  });
});

describe("forecastTitle", () => {
  it("names the one stop", () => {
    expect(forecastTitle(["Lisbon, Portugal", "Lisbon, Portugal"])).toBe("Lisbon");
  });

  it("follows the route through a few stops", () => {
    expect(forecastTitle(["Lisbon, Portugal", "Porto, Portugal", "Porto, Portugal", "Lisbon, Portugal"])).toBe(
      "Lisbon → Porto → Lisbon",
    );
  });

  it("counts the stops on a long route", () => {
    expect(forecastTitle(["Lisbon", "Porto", "Braga", "Faro"])).toBe("4 stops");
  });
});

describe("stopStarts", () => {
  it("marks nothing on a one-stop trip", () => {
    expect(stopStarts([{ date: "2026-11-22", placeName: "Lisbon" }, { date: "2026-11-23", placeName: "Lisbon" }]).size).toBe(0);
  });

  it("marks the first day at each stop", () => {
    const days = [
      { date: "2026-11-22", placeName: "Lisbon" },
      { date: "2026-11-23", placeName: "Lisbon" },
      { date: "2026-11-24", placeName: "Porto" },
    ];
    expect([...stopStarts(days)]).toEqual(["2026-11-22", "2026-11-24"]);
  });
});
