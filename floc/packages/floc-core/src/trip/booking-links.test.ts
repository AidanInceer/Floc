import { describe, expect, it } from "vitest";

import {
  bookingPlan,
  eventFlightUrl,
  flightLinks,
  stayLinks,
  type StayRow,
} from "./booking-links";

const day = (dayId: number, date: string, placeId: number | null, name: string | null = null) => ({
  dayId,
  date,
  overnightPlaceId: placeId,
  overnightPlaceName: name,
});

describe("flightLinks", () => {
  it("names the destination and both dates on Google Flights", () => {
    const [google] = flightLinks({ destination: "Lisbon", start: "2026-10-14", end: "2026-10-20", prefill: true });
    expect(google.site).toBe("Google Flights");
    expect(decodeURIComponent(google.url)).toContain(
      "Flights to Lisbon on 2026-10-14 returning 2026-10-20",
    );
  });

  it("still gives both sites with dates only", () => {
    const links = flightLinks({ destination: null, start: "2026-10-14", end: "2026-10-20", prefill: true });
    expect(links.map((l) => l.site)).toEqual(["Google Flights", "Skyscanner"]);
    expect(decodeURIComponent(links[0].url)).toContain("Flights on 2026-10-14 returning 2026-10-20");
    expect(links[1].url).toContain("outboundDate=2026-10-14");
  });

  it("opens each site's own search, with nothing filled in, without prefill", () => {
    const links = flightLinks({ destination: "Lisbon", start: "2026-10-14", end: "2026-10-20", prefill: false });
    expect(links.map((l) => l.site)).toEqual(["Google Flights", "Skyscanner"]);
    for (const { url } of links) {
      expect(new URL(url).search).toBe("");
      expect(url).not.toContain("Lisbon");
    }
  });
});

describe("stayLinks", () => {
  it("opens each site's own search, with nothing filled in, without prefill", () => {
    const links = stayLinks({ place: "Porto", checkIn: "2026-10-14", checkOut: "2026-10-17", adults: 4, prefill: false });
    expect(links.map((l) => l.site)).toEqual(["Booking.com", "Trip.com"]);
    for (const { url } of links) expect(new URL(url).search).toBe("");
  });

  it("sends place, check-in, check-out and head count to both sites", () => {
    const [booking, trip] = stayLinks({
      place: "Porto",
      checkIn: "2026-10-14",
      checkOut: "2026-10-17",
      adults: 4,
      prefill: true,
    });
    expect(booking.site).toBe("Booking.com");
    const b = new URL(booking.url).searchParams;
    expect([b.get("ss"), b.get("checkin"), b.get("checkout"), b.get("group_adults")]).toEqual([
      "Porto",
      "2026-10-14",
      "2026-10-17",
      "4",
    ]);
    expect(trip.site).toBe("Trip.com");
    expect(new URL(trip.url).searchParams.get("keyword")).toBe("Porto");
  });
});

describe("eventFlightUrl", () => {
  it("needs both ends", () => {
    expect(eventFlightUrl({ origin: "", destination: "Rome", date: "2026-10-14", prefill: true })).toBeNull();
  });

  it("asks Google Flights for the one leg", () => {
    const url = eventFlightUrl({ origin: "London", destination: "Rome", date: "2026-10-14", prefill: true });
    expect(decodeURIComponent(url!)).toContain("Flights from London to Rome on 2026-10-14");
  });

  it("opens Google Flights empty without prefill", () => {
    const url = eventFlightUrl({ origin: "London", destination: "Rome", date: "2026-10-14", prefill: false });
    expect(new URL(url!).search).toBe("");
  });
});

describe("bookingPlan", () => {
  const trip = { startDate: "2026-10-14", endDate: "2026-10-16" };

  it("is nothing without dates", () => {
    expect(
      bookingPlan({ trip: { startDate: null, endDate: null }, days: [], today: "2026-09-01", adults: 2, prefill: true }),
    ).toBeNull();
  });

  it("is nothing once the trip has started", () => {
    expect(bookingPlan({ trip, days: [], today: "2026-10-14", adults: 2, prefill: true })).toBeNull();
  });

  it("keeps every link but fills none in without prefill", () => {
    const plan = bookingPlan({
      trip,
      days: [day(1, "2026-10-14", 7, "Lisbon")],
      today: "2026-09-01",
      adults: 2,
      prefill: false,
    });
    const [stop] = plan!.stays as StayRow[];
    const links = [...plan!.flights, ...(stop.kind === "stop" ? stop.links : [])];
    expect(links).toHaveLength(4);
    for (const { url } of links) expect(new URL(url).search).toBe("");
  });

  it("says stays are unset when no night has a place", () => {
    const plan = bookingPlan({
      trip,
      days: [day(1, "2026-10-14", null), day(2, "2026-10-15", null)],
      today: "2026-09-01",
      adults: 2,
      prefill: true,
    });
    expect(plan!.stays).toBe("unset");
    expect(plan!.flights).toHaveLength(2);
  });

  it("gives one row per stop, checking out the morning after, with gaps named", () => {
    const plan = bookingPlan({
      trip,
      days: [
        day(1, "2026-10-14", 7, "Lisbon"),
        day(2, "2026-10-15", 7, "Lisbon"),
        day(3, "2026-10-16", null),
      ],
      today: "2026-09-01",
      adults: 3,
      prefill: true,
    });
    expect(decodeURIComponent(plan!.flights[0].url)).toContain("Flights to Lisbon");
    const [stop, gap] = plan!.stays as StayRow[];
    expect(stop).toMatchObject({
      kind: "stop",
      placeName: "Lisbon",
      checkIn: "2026-10-14",
      checkOut: "2026-10-16",
    });
    expect(gap).toEqual({ kind: "gap", checkIn: "2026-10-16", checkOut: "2026-10-17" });
  });
});
