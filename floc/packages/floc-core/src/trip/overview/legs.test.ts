import { describe, expect, it } from "vitest";

import { filesByCategory, hopLabel, transportModes, tripLegs, type LegFile } from "./legs";

const day = (dayId: number, date: string, placeId: number | null, placeName: string | null = null) => ({
  dayId,
  date,
  overnightPlaceId: placeId,
  placeName: placeId === null ? null : (placeName ?? `Place ${placeId}`),
});

const file = (id: number, category: LegFile["category"], dayId: number | null = null, eventDayId: number | null = null) => ({
  id,
  category,
  dayId,
  eventDayId,
});

const lisbonThenLagos = [
  day(1, "2026-10-09", 10, "Lisbon"),
  day(2, "2026-10-10", 10, "Lisbon"),
  day(3, "2026-10-11", 20, "Lagos"),
];

describe("tripLegs", () => {
  it("makes one leg per run of nights in one place, numbered like the map pins", () => {
    const { legs } = tripLegs({ days: lisbonThenLagos, modes: new Map(), files: [] });

    expect(legs.map((l) => [l.no, l.placeName, l.nights])).toEqual([
      [1, "Lisbon", 2],
      [2, "Lagos", 1],
    ]);
  });

  it("leaves a leg on the morning after its last night", () => {
    const { legs } = tripLegs({ days: lisbonThenLagos, modes: new Map(), files: [] });

    expect(legs[0]).toMatchObject({ arrive: "2026-10-09", leave: "2026-10-11" });
    expect(legs[1]).toMatchObject({ arrive: "2026-10-11", leave: "2026-10-12" });
  });

  it("skips runs with no overnight place, so numbering stays with the map", () => {
    const { legs } = tripLegs({
      days: [day(1, "2026-10-09", null), day(2, "2026-10-10", 10)],
      modes: new Map(),
      files: [],
    });

    expect(legs.map((l) => [l.no, l.placeName])).toEqual([[1, "Place 10"]]);
  });

  it("travels in by the mode on the leg's first day", () => {
    const { legs } = tripLegs({
      days: lisbonThenLagos,
      modes: new Map([[2, "flight"], [3, "car"]] as const),
      files: [],
    });

    expect(legs.map((l) => l.mode)).toEqual([null, "car"]);
  });

  it("puts a file on the leg whose day it sits on, by day or by event", () => {
    const flights = file(1, "travel", 1);
    const tour = file(2, "tickets", null, 3);
    const { legs } = tripLegs({ days: lisbonThenLagos, modes: new Map(), files: [flights, tour] });

    expect(legs[0].files).toEqual([flights]);
    expect(legs[1].files).toEqual([tour]);
  });

  it("names a stay file as the leg's stay, and none when there is none", () => {
    const flat = file(1, "stay", 2);
    const { legs } = tripLegs({ days: lisbonThenLagos, modes: new Map(), files: [flat] });

    expect(legs[0].stay).toBe(flat);
    expect(legs[1].stay).toBeNull();
  });

  it("keeps files with no day, or a day outside every leg, for the whole trip", () => {
    const insurance = file(1, "admin");
    const onUnplacedDay = file(2, "travel", 9);
    const { wholeTrip } = tripLegs({
      days: [...lisbonThenLagos, day(9, "2026-10-12", null)],
      modes: new Map(),
      files: [insurance, onUnplacedDay],
    });

    expect(wholeTrip).toEqual([insurance, onUnplacedDay]);
  });

  it("has no legs for a trip with no days", () => {
    expect(tripLegs({ days: [], modes: new Map(), files: [file(1, "admin")] })).toEqual({
      legs: [],
      wholeTrip: [file(1, "admin")],
    });
  });
});

describe("transportModes", () => {
  it("reads each day's first transport event, as the web's server read does", () => {
    const modes = transportModes([
      {
        id: 1,
        events: [
          { type: "activity", transportType: null, orderIndex: 0 },
          { type: "transport", transportType: "ferry", orderIndex: 2 },
          { type: "transport", transportType: "train", orderIndex: 1 },
        ],
      },
      { id: 2, events: [{ type: "transport", transportType: null, orderIndex: 0 }] },
    ]);

    expect([...modes]).toEqual([[1, "train"]]);
  });
});

describe("hopLabel", () => {
  it("says how you get to the next place", () => {
    expect(hopLabel("train", "Sintra")).toBe("Train to Sintra");
    expect(hopLabel("flight", "Faro")).toBe("Fly to Faro");
    expect(hopLabel("car", "Évora")).toBe("Drive to Évora");
    expect(hopLabel("ferry", "Tavira")).toBe("Ferry to Tavira");
  });

  it("still names the move when the mode is unknown", () => {
    expect(hopLabel("other", "Lagos")).toBe("On to Lagos");
    expect(hopLabel(null, "Lagos")).toBe("On to Lagos");
  });
});

describe("filesByCategory", () => {
  it("counts files per category in the house order, leaving out empty ones", () => {
    expect(filesByCategory([file(1, "admin"), file(2, "travel"), file(3, "travel")])).toEqual([
      { category: "travel", count: 2 },
      { category: "admin", count: 1 },
    ]);
  });
});
