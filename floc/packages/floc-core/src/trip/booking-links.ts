/**
 * Deep links out to flight and stay search. Flight booking is out of scope
 * (CLAUDE.md) — Floc only prefills a search on another site. Only places,
 * dates and a head count go into a URL: never a name or an email.
 */
import { addDays } from "../dates/dates";
import { deriveStops, type StopDayInput } from "../itinerary/stops";

export type BookingSite = "Google Flights" | "Skyscanner" | "Booking.com" | "Trip.com";

export type BookingLink = { site: BookingSite; url: string };

export type StayRow =
  | { kind: "stop"; placeName: string; checkIn: string; checkOut: string; links: BookingLink[] }
  | { kind: "gap"; checkIn: string; checkOut: string };

export type BookingPlan = {
  flights: BookingLink[];
  stays: StayRow[] | "unset";
};

const googleFlights = (q: string) =>
  `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;

export function flightLinks({
  destination,
  start,
  end,
}: {
  destination: string | null;
  start: string;
  end: string;
}): BookingLink[] {
  const to = destination ? ` to ${destination}` : "";
  // Why: Skyscanner's prefill wants airport codes, which a place has none of; dates are what it can take.
  const skyscanner = new URL("https://www.skyscanner.net/g/referrals/v1/flights/day-view");
  skyscanner.searchParams.set("outboundDate", start);
  skyscanner.searchParams.set("inboundDate", end);
  return [
    { site: "Google Flights", url: googleFlights(`Flights${to} on ${start} returning ${end}`) },
    { site: "Skyscanner", url: skyscanner.toString() },
  ];
}

export function stayLinks({
  place,
  checkIn,
  checkOut,
  adults,
}: {
  place: string;
  checkIn: string;
  checkOut: string;
  adults: number;
}): BookingLink[] {
  const booking = new URL("https://www.booking.com/searchresults.html");
  booking.searchParams.set("ss", place);
  booking.searchParams.set("checkin", checkIn);
  booking.searchParams.set("checkout", checkOut);
  booking.searchParams.set("group_adults", String(adults));
  booking.searchParams.set("no_rooms", "1");

  const trip = new URL("https://www.trip.com/hotels/list");
  trip.searchParams.set("keyword", place);
  trip.searchParams.set("checkin", checkIn.replaceAll("-", "/"));
  trip.searchParams.set("checkout", checkOut.replaceAll("-", "/"));
  trip.searchParams.set("adult", String(adults));

  return [
    { site: "Booking.com", url: booking.toString() },
    { site: "Trip.com", url: trip.toString() },
  ];
}

/** One flight leg on a transport event (ticket 10). */
export function eventFlightUrl({
  origin,
  destination,
  date,
}: {
  origin: string;
  destination: string;
  date: string;
}): string | null {
  if (!origin || !destination) return null;
  return googleFlights(`Flights from ${origin} to ${destination} on ${date}`);
}

/** What the group can book: only while the dates are set and the trip is still ahead. Days sorted by date. */
export function bookingPlan({
  trip,
  days,
  today,
  adults,
}: {
  trip: { startDate: string | null; endDate: string | null };
  days: StopDayInput[];
  today: string;
  adults: number;
}): BookingPlan | null {
  const { startDate, endDate } = trip;
  if (!startDate || !endDate || today >= startDate) return null;

  const stops = deriveStops(days);
  const firstPlace = stops.find((s) => s.placeName)?.placeName ?? null;
  const flights = flightLinks({ destination: firstPlace, start: startDate, end: endDate });
  if (!firstPlace) return { flights, stays: "unset" };

  const stays = stops.map((s): StayRow => {
    const checkIn = s.startDate;
    const checkOut = addDays(s.endDate, 1);
    return s.placeName
      ? { kind: "stop", placeName: s.placeName, checkIn, checkOut, links: stayLinks({ place: s.placeName, checkIn, checkOut, adults }) }
      : { kind: "gap", checkIn, checkOut };
  });
  return { flights, stays };
}
