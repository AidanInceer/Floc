import { describe, expect, it } from "vitest";

import { TRIP_COLORS, readTripColor, tripPastel } from "./trip-color";

describe("readTripColor", () => {
  it("keeps a known colour and rejects anything else", () => {
    expect(readTripColor("mint")).toBe("mint");
    expect(readTripColor("chartreuse")).toBeNull();
    expect(readTripColor(null)).toBeNull();
  });
});

describe("tripPastel", () => {
  it("prefers the picked colour over the rotation", () => {
    expect(tripPastel("blush", 1)).toBe("blush");
  });

  it("rotates by id when nothing is picked, so a trip keeps its colour", () => {
    expect(tripPastel(null, 0)).toBe(TRIP_COLORS[0]);
    expect(tripPastel(null, 5)).toBe(TRIP_COLORS[1]);
    expect(tripPastel(null, 5)).toBe(tripPastel(null, 5));
  });
});
