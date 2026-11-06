import { describe, expect, it } from "vitest";

import { stayNights, type Night } from "./overnight-pick";

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
});
