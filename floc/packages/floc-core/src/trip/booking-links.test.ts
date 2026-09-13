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
    const [google] = flightLinks({ destination: "Lisbon", start: "2026-10-14", end: "2026-10-20" });
    expect(google.site).toBe("Google Flights");
    expect(decodeURIComponent(google.url)).toContain(
      "Flights to Lisbon on 2026-10-14 returning 2026-10-20",
    );
  });

  it("still gives both sites with dates only", () => {
    const links = flightLinks({ destination: null, start: "2026-10-14", end: "2026-10-20" });
    expect(links.map((l) => l.site)).toEqual(["Google Flights", "Skyscanner"]);
    expect(decodeURIComponent(links[0].url)).toContain("Flights on 2026-10-14 returning 2026-10-20");
    expect(links[1].url).toContain("outboundDate=2026-10-14");
  });
});

describe("stayLinks", () => {
  it("sends place, check-in, check-out and head count to both sites", () => {
    const [booking, trip] = stayLinks({
      place: "Porto",
      checkIn: "2026-10-14",
      checkOut: "2026-10-17",
      adults: 4,
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
    expect(eventFlightUrl({ origin: "", destination: "Rome", date: "2026-10-14" })).toBeNull();
  });

  it("asks Google Flights for the one leg", () => {
    const url = eventFlightUrl({ origin: "London", destination: "Rome", date: "2026-10-14" });
    expect(decodeURIComponent(url!)).toContain("Flights from London to Rome on 2026-10-14");
  });
});

describe("bookingPlan", () => {
  const trip = { startDate: "2026-10-14", endDate: "2026-10-16" };

  it("is nothing without dates", () => {
    expect(
      bookingPlan({ trip: { startDate: null, endDate: null }, days: [], today: "2026-09-01", adults: 2 }),
    ).toBeNull();
  });

  it("is nothing once the trip has started", () => {
    expect(bookingPlan({ trip, days: [], today: "2026-10-14", adults: 2 })).toBeNull();
  });

  it("says stays are unset when no night has a place", () => {
    const plan = bookingPlan({
      trip,
      days: [day(1, "2026-10-14", null), day(2, "2026-10-15", null)],
      today: "2026-09-01",
      adults: 2,
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
