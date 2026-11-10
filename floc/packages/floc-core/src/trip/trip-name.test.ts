import { describe, expect, it } from "vitest";

import { NO_TRIP_NAME, readTripName, TRIP_NAME_TOO_LONG } from "./trip-name";

describe("readTripName", () => {
  it("trims the name and gives each word a capital", () => {
    expect(readTripName("  lake district  ")).toEqual({ name: "Lake District" });
  });

  it("refuses an empty name, or one that is not text", () => {
    expect(readTripName("   ")).toEqual({ problem: NO_TRIP_NAME });
    expect(readTripName({ name: "x" })).toEqual({ problem: NO_TRIP_NAME });
  });

  it("refuses a name past the cap rather than cutting it", () => {
    expect(readTripName("a".repeat(50))).toEqual({ name: `A${"a".repeat(49)}` });
    expect(readTripName("a".repeat(51))).toEqual({ problem: TRIP_NAME_TOO_LONG });
  });
});
