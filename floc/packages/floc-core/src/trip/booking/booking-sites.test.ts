import { describe, expect, it } from "vitest";

import {
  DEFAULT_BOOKING_SITES,
  MAX_SITES,
  canToggleSite,
  readBookingSites,
  siteChoices,
  splitBySites,
  toggleSite,
} from "./booking-sites";

describe("readBookingSites", () => {
  it("reads nothing as today's two sites a kind", () => {
    expect(readBookingSites(null)).toEqual(DEFAULT_BOOKING_SITES);
    expect(DEFAULT_BOOKING_SITES).toEqual({ flights: ["Google Flights", "Skyscanner"], stays: ["Booking.com", "Trip.com"] });
  });

  it("keeps the order the person chose", () => {
    expect(readBookingSites({ flights: ["Kiwi.com", "Google Flights"], stays: ["Airbnb"] })).toEqual({
      flights: ["Kiwi.com", "Google Flights"],
      stays: ["Airbnb"],
    });
  });

  it("drops unknown names, repeats, a site of the other kind, and anything past two", () => {
    const read = readBookingSites({
      flights: ["Kayak", "Kayak", "Booking.com", "Ryanair", "Skyscanner", "Google Flights", "Kiwi.com"],
      stays: ["Hostelworld"],
    });
    expect(read.flights).toEqual(["Kayak", "Skyscanner"]);
    expect(read.flights).toHaveLength(MAX_SITES);
  });

  it("falls back per kind when a kind is empty or the wrong shape", () => {
    expect(readBookingSites({ flights: [], stays: "Airbnb" })).toEqual(DEFAULT_BOOKING_SITES);
    expect(readBookingSites({ flights: ["Kayak"] })).toEqual({ flights: ["Kayak"], stays: DEFAULT_BOOKING_SITES.stays });
  });
});

describe("toggleSite", () => {
  it("adds a site at the end", () => {
    const one = { ...DEFAULT_BOOKING_SITES, stays: ["Booking.com" as const] };
    expect(toggleSite(one, "stays", "Airbnb").stays).toEqual(["Booking.com", "Airbnb"]);
  });

  it("drops a site and keeps the rest in order", () => {
    expect(toggleSite(DEFAULT_BOOKING_SITES, "flights", "Google Flights").flights).toEqual(["Skyscanner"]);
  });

  it("never leaves a kind empty", () => {
    const one = { ...DEFAULT_BOOKING_SITES, stays: ["Airbnb" as const] };
    expect(toggleSite(one, "stays", "Airbnb")).toBe(one);
    expect(canToggleSite(one, "stays", "Airbnb")).toBe(false);
  });

  it("never holds more than two", () => {
    const full = DEFAULT_BOOKING_SITES;
    expect(MAX_SITES).toBe(2);
    expect(toggleSite(full, "stays", "Hostelworld")).toBe(full);
    expect(canToggleSite(full, "stays", "Hostelworld")).toBe(false);
    expect(canToggleSite(full, "stays", "Trip.com")).toBe(true);
  });

  it("refuses a site of the other kind", () => {
    expect(toggleSite(DEFAULT_BOOKING_SITES, "flights", "Airbnb")).toBe(DEFAULT_BOOKING_SITES);
  });
});

describe("splitBySites", () => {
  it("puts your sites first, in your order, and the rest in catalogue order", () => {
    const links = ["Booking.com", "Trip.com", "Airbnb", "Hotels.com", "Hostelworld"].map((site) => ({ site, url: site }));
    const { mine, more } = splitBySites(links, ["Airbnb", "Booking.com"]);
    expect(mine.map((l) => l.site)).toEqual(["Airbnb", "Booking.com"]);
    expect(more.map((l) => l.site)).toEqual(["Trip.com", "Hotels.com", "Hostelworld"]);
  });
});

describe("siteChoices", () => {
  it("lists every site of a kind in catalogue order, with what it is for and whether it is yours", () => {
    const lines = siteChoices({ ...DEFAULT_BOOKING_SITES, flights: ["Kiwi.com"] }, "flights");
    expect(lines.map((l) => [l.site, l.on])).toEqual([
      ["Google Flights", false],
      ["Skyscanner", false],
      ["Kayak", false],
      ["Kiwi.com", true],
    ]);
    expect(lines[3].use).toBe("Mix airlines");
  });

  it("says why a site cannot be ticked once two are yours", () => {
    const airbnb = siteChoices(DEFAULT_BOOKING_SITES, "stays").find((l) => l.site === "Airbnb");
    expect(airbnb).toMatchObject({ on: false, can: false, why: "Up to 2" });
  });

  it("says why your last site cannot be dropped", () => {
    const [kayak] = siteChoices({ ...DEFAULT_BOOKING_SITES, flights: ["Kayak"] }, "flights").filter((l) => l.on);
    expect(kayak).toMatchObject({ site: "Kayak", can: false, why: "Keep at least one" });
  });

  it("gives no reason when a site can be flipped", () => {
    const booking = siteChoices(DEFAULT_BOOKING_SITES, "stays").find((l) => l.site === "Booking.com");
    expect(booking).toMatchObject({ on: true, can: true, why: null });
  });
});
