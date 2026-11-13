import { describe, expect, it } from "vitest";

import { listingStartHref, newTripName, savedStartHref, startTripHref, wishListParam, wishStartHref } from "./start-trip";

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

describe("listingStartHref", () => {
  it("opens the listing's Explore page with the copy sheet open", () => {
    expect(listingStartHref(true, "japan-golden-route")).toBe("/explore/japan-golden-route?start=1");
  });

  it("goes through sign-up first, then to the same sheet", () => {
    expect(listingStartHref(false, "japan-golden-route")).toBe("/signup?redirect=%2Fexplore%2Fjapan-golden-route%3Fstart%3D1");
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

describe("savedStartHref", () => {
  it("starts from a saved trip with its copy choice open, so its plan comes across (ADR-025)", () => {
    expect(savedStartHref({ kind: "trip", id: "japan-golden-route" })).toBe("/explore/japan-golden-route?start=1");
  });

  it("starts from a want-to-go country as a new trip named after it", () => {
    expect(savedStartHref({ kind: "country", name: "Bosnia and Herzegovina" })).toBe("/trips?new=Bosnia%20and%20Herzegovina");
  });
});

describe("wishStartHref", () => {
  it("copies a listing with the list's people along", () => {
    expect(wishStartHref({ kind: "explore", presetId: "japan-golden-route" }, 7)).toBe("/explore/japan-golden-route?start=1&wish=7");
  });

  it("names a new trip after a country, text or link", () => {
    expect(wishStartHref({ kind: "country", name: "Portugal" }, 7)).toBe("/trips?new=Portugal&wish=7");
    expect(wishStartHref({ kind: "text", text: "Somewhere with a lake" }, 7)).toBe("/trips?new=Somewhere%20with%20a%20lake&wish=7");
    expect(wishStartHref({ kind: "text", text: "x".repeat(80) }, 7)).toBe(`/trips?new=${"x".repeat(50)}&wish=7`);
  });
});

describe("wishListParam", () => {
  it("reads a list id, or null", () => {
    expect(wishListParam("7")).toBe(7);
    expect(wishListParam(["8"])).toBe(8);
    expect(wishListParam("x")).toBeNull();
    expect(wishListParam("-1")).toBeNull();
    expect(wishListParam(undefined)).toBeNull();
  });
});
