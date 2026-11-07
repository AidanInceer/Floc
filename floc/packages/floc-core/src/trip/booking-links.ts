/**
 * Deep links out to flight and stay search. Flight booking is out of scope
 * (CLAUDE.md) — Floc only prefills a search on another site. Only places,
 * dates and a head count go into a URL: never a name or an email.
 */
import { addDays } from "../dates/dates";
import { deriveStops, type StopDayInput } from "../itinerary/stops";
import type { BookingSite } from "./booking-sites";
import { hotelFile, type LegFile } from "./overview/legs";

export type { BookingSite } from "./booking-sites";

export type BookingLink = { site: BookingSite; url: string };

/** The file that books a stay: what its Booked pill names. */
export type BookedHotel = { id: number; name: string };

export type StayRow =
  | {
      kind: "stop";
      placeName: string;
      checkIn: string;
      checkOut: string;
      links: BookingLink[];
      /** The stop's first day: where a booking uploaded from this row is filed. */
      dayId: number;
      hotel: BookedHotel | null;
    }
  | { kind: "gap"; checkIn: string; checkOut: string };

export type BookingPlan = {
  flights: BookingLink[];
  stays: StayRow[] | "unset";
};

const GOOGLE_FLIGHTS = "https://www.google.com/travel/flights";

const googleFlights = (q: string) => `${GOOGLE_FLIGHTS}?q=${encodeURIComponent(q)}`;

// Why: Kayak and Kiwi.com search by airport or their own place ids, which a place has none of, so they open their own search.
const FLIGHT_HOMES: BookingLink[] = [
  { site: "Kayak", url: "https://www.kayak.co.uk/flights" },
  { site: "Kiwi.com", url: "https://www.kiwi.com/en/" },
];
const SKYSCANNER_HOME = "https://www.skyscanner.net/flights";

function skyscannerDays(outbound: string, inbound?: string): string {
  // Why: Skyscanner's prefill wants airport codes, which a place has none of; dates are what it can take.
  const url = new URL("https://www.skyscanner.net/g/referrals/v1/flights/day-view");
  url.searchParams.set("outboundDate", outbound);
  if (inbound) url.searchParams.set("inboundDate", inbound);
  return url.toString();
}

/** Filling in the place, dates and head count is Pro (`booking.prefill`); free opens each site's own search. */
type Prefill = { prefill: boolean };

export function flightLinks({
  destination,
  start,
  end,
  prefill,
}: {
  destination: string | null;
  start: string;
  end: string;
} & Prefill): BookingLink[] {
  if (!prefill) {
    return [{ site: "Google Flights", url: GOOGLE_FLIGHTS }, { site: "Skyscanner", url: SKYSCANNER_HOME }, ...FLIGHT_HOMES];
  }
  const to = destination ? ` to ${destination}` : "";
  return [
    { site: "Google Flights", url: googleFlights(`Flights${to} on ${start} returning ${end}`) },
    { site: "Skyscanner", url: skyscannerDays(start, end) },
    ...FLIGHT_HOMES,
  ];
}

export function stayLinks({
  place,
  checkIn,
  checkOut,
  adults,
  prefill,
}: {
  place: string;
  checkIn: string;
  checkOut: string;
  adults: number;
} & Prefill): BookingLink[] {
  if (!prefill) {
    return [
      { site: "Booking.com", url: "https://www.booking.com/" },
      { site: "Trip.com", url: "https://www.trip.com/hotels/" },
      { site: "Airbnb", url: "https://www.airbnb.co.uk/" },
      { site: "Hotels.com", url: "https://uk.hotels.com/" },
      HOSTELWORLD,
    ];
  }
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

  const airbnb = new URL(`https://www.airbnb.co.uk/s/${encodeURIComponent(place)}/homes`);
  airbnb.searchParams.set("checkin", checkIn);
  airbnb.searchParams.set("checkout", checkOut);
  airbnb.searchParams.set("adults", String(adults));

  const hotels = new URL("https://uk.hotels.com/Hotel-Search");
  hotels.searchParams.set("destination", place);
  hotels.searchParams.set("startDate", checkIn);
  hotels.searchParams.set("endDate", checkOut);
  hotels.searchParams.set("adults", String(adults));

  return [
    { site: "Booking.com", url: booking.toString() },
    { site: "Trip.com", url: trip.toString() },
    { site: "Airbnb", url: airbnb.toString() },
    { site: "Hotels.com", url: hotels.toString() },
    HOSTELWORLD,
  ];
}

// Why: Hostelworld searches by its own city ids, which a place has none of, so it opens its own search.
const HOSTELWORLD: BookingLink = { site: "Hostelworld", url: "https://www.hostelworld.com/" };

/** One flight leg on a transport event (ticket 10), on every flight site. */
export function eventFlightLinks({
  origin,
  destination,
  date,
  prefill,
}: {
  origin: string;
  destination: string;
  date: string;
} & Prefill): BookingLink[] | null {
  if (!origin || !destination) return null;
  if (!prefill) return [{ site: "Google Flights", url: GOOGLE_FLIGHTS }, { site: "Skyscanner", url: SKYSCANNER_HOME }, ...FLIGHT_HOMES];
  return [
    { site: "Google Flights", url: googleFlights(`Flights from ${origin} to ${destination} on ${date}`) },
    { site: "Skyscanner", url: skyscannerDays(date) },
    ...FLIGHT_HOMES,
  ];
}

/** Check-out after a stay's last day: the morning after, unless that day is the trip's last, the day home (rule 3). */
export function stayCheckOut(lastDay: string, tripLastDay: string | null): string {
  return lastDay === tripLastDay ? lastDay : addDays(lastDay, 1);
}

/** What the group can book: only while the dates are set and the trip is still ahead. Days sorted by date. */
export function bookingPlan({
  trip,
  days,
  today,
  adults,
  prefill,
  files = [],
}: {
  trip: { startDate: string | null; endDate: string | null };
  days: StopDayInput[];
  today: string;
  adults: number;
  /** The files this person can see; a hotel file on a stop books it. */
  files?: (LegFile & { id: number; name: string })[];
} & Prefill): BookingPlan | null {
  const { startDate, endDate } = trip;
  if (!startDate || !endDate || today >= startDate) return null;

  const stops = deriveStops(days);
  const firstPlace = stops.find((s) => s.placeName)?.placeName ?? null;
  const flights = flightLinks({ destination: firstPlace, start: startDate, end: endDate, prefill });
  if (!firstPlace) return { flights, stays: "unset" };

  const stays = stops.filter((s) => s.nights > 0).map((s): StayRow => {
    const checkIn = s.startDate;
    const checkOut = addDays(s.startDate, s.nights);
    if (!s.placeName) return { kind: "gap", checkIn, checkOut };
    const booked = hotelFile(files, new Set(s.dayIds));
    return {
      kind: "stop",
      placeName: s.placeName,
      checkIn,
      checkOut,
      links: stayLinks({ place: s.placeName, checkIn, checkOut, adults, prefill }),
      dayId: s.dayIds[0],
      hotel: booked ? { id: booked.id, name: booked.name } : null,
    };
  });
  return { flights, stays };
}
