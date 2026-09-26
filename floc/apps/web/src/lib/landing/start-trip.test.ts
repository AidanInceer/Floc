import { describe, expect, it } from "vitest";

import { newTripName, startTripHref } from "./start-trip";

describe("startTripHref", () => {
  it("opens the new-trip sheet on My trips, named, when signed in", () => {
    expect(startTripHref(true, " Lisbon ")).toBe("/trips?new=Lisbon");
  });

  it("opens the sheet unnamed when nothing was typed", () => {
    expect(startTripHref(true, "  ")).toBe("/trips?new=");
  });

  it("goes through sign-up first, then to the same sheet", () => {
    expect(startTripHref(false, "Lake District")).toBe(
      "/signup?redirect=%2Ftrips%3Fnew%3DLake%2520District",
    );
  });
});

describe("newTripName", () => {
  it("is null when the sheet was not asked for", () => {
    expect(newTripName(undefined)).toBeNull();
  });

  it("trims the name and caps it at a trip name's length", () => {
    expect(newTripName("  Lisbon ")).toBe("Lisbon");
    expect(newTripName("x".repeat(500))?.length).toBeLessThan(500);
  });

  it("takes the first value when the parameter repeats", () => {
    expect(newTripName(["Porto", "Faro"])).toBe("Porto");
  });
});
