import { describe, expect, it } from "vitest";

import { stayNights, stayOpening, stayWrites, type Night } from "./overnight-pick";

// Porto to Lisbon, May 2027: Évora on the 6th, Lisbon the 7th and 8th, the 9th undecided.
const NIGHTS: Night[] = [
  { date: "2027-05-06", placeId: 3, placeName: "Évora" },
  { date: "2027-05-07", placeId: 4, placeName: "Lisbon" },
  { date: "2027-05-08", placeId: 4, placeName: "Lisbon" },
  { date: "2027-05-09", placeId: null, placeName: null },
];

describe("stayNights", () => {
  it("counts the nights and names the stay from check-in to check-out", () => {
    expect(stayNights(NIGHTS, { start: "2027-05-06", placeId: 3 }, "2027-05-06").label).toBe("1 night, Thu 6 – Fri 7 May");
    expect(stayNights(NIGHTS, { start: "2027-05-06", placeId: 3 }, "2027-05-07").label).toBe("2 nights, Thu 6 – Sat 8 May");
  });

  it("takes nothing while the stay keeps to its own nights", () => {
    expect(stayNights(NIGHTS, { start: "2027-05-06", placeId: 3 }, "2027-05-06").taken).toEqual([]);
  });

  it("says which nights it takes from the next stay, once per stay", () => {
    expect(stayNights(NIGHTS, { start: "2027-05-06", placeId: 3 }, "2027-05-08").taken).toEqual(["Takes Fri 7 – Sat 8 May from Lisbon."]);
    expect(stayNights(NIGHTS, { start: "2027-05-06", placeId: 3 }, "2027-05-07").taken).toEqual(["Takes Fri 7 May from Lisbon."]);
  });

  it("takes nothing from a night nobody has decided", () => {
    expect(stayNights(NIGHTS, { start: "2027-05-06", placeId: 3 }, "2027-05-09").taken).toEqual(["Takes Fri 7 – Sat 8 May from Lisbon."]);
  });

  it("treats a new stay with no place yet as taking every decided night", () => {
    expect(stayNights(NIGHTS, { start: "2027-05-06", placeId: null }, "2027-05-06").taken).toEqual(["Takes Thu 6 May from Évora."]);
  });

  it("names the other stay as the strip does, without its country", () => {
    const night: Night = { date: "2027-05-06", placeId: 5, placeName: "Lagos, Portugal" };
    expect(stayNights([night], { start: "2027-05-06", placeId: 3 }, "2027-05-06").taken).toEqual(["Takes Thu 6 May from Lagos."]);
  });
});

describe("stayOpening", () => {
  it("opens a stay on its own nights", () => {
    expect(stayOpening({ start: "2027-05-07", end: "2027-05-08" }, "2027-05-10")).toEqual({ start: "2027-05-07", end: "2027-05-08" });
  });

  it("leaves out the trip's last day, which is the morning you go home", () => {
    expect(stayOpening({ start: "2027-05-07", end: "2027-05-10" }, "2027-05-10")).toEqual({ start: "2027-05-07", end: "2027-05-09" });
  });

  it("keeps a one-day stop on the last day as it is", () => {
    expect(stayOpening({ start: "2027-05-10", end: "2027-05-10" }, "2027-05-10")).toEqual({ start: "2027-05-10", end: "2027-05-10" });
  });
});

describe("stayWrites", () => {
  const LISBON = { start: "2027-05-07", end: "2027-05-08", placeId: 4 };

  it("sets the picked nights", () => {
    expect(stayWrites(LISBON, "2027-05-07", "2027-05-09", "2027-05-12")).toEqual([{ start: "2027-05-07", end: "2027-05-09", clear: false }]);
  });

  it("gives back the nights the stay no longer covers", () => {
    expect(stayWrites(LISBON, "2027-05-08", "2027-05-08", "2027-05-12")).toEqual([
      { start: "2027-05-08", end: "2027-05-08", clear: false },
      { start: "2027-05-07", end: "2027-05-07", clear: true },
    ]);
  });

  it("gives back both ends when a stay moves inside its old nights", () => {
    const wide = { start: "2027-05-06", end: "2027-05-10", placeId: 4 };
    expect(stayWrites(wide, "2027-05-07", "2027-05-08", "2027-05-12")).toEqual([
      { start: "2027-05-07", end: "2027-05-08", clear: false },
      { start: "2027-05-06", end: "2027-05-06", clear: true },
      { start: "2027-05-09", end: "2027-05-10", clear: true },
    ]);
  });

  it("clears nothing when the stop had no place", () => {
    expect(stayWrites({ ...LISBON, placeId: null }, "2027-05-08", "2027-05-08", "2027-05-12")).toEqual([
      { start: "2027-05-08", end: "2027-05-08", clear: false },
    ]);
  });

  it("runs a stay ending the night before the last day on to the last day", () => {
    expect(stayWrites(LISBON, "2027-05-07", "2027-05-11", "2027-05-12")).toEqual([{ start: "2027-05-07", end: "2027-05-12", clear: false }]);
  });
});
