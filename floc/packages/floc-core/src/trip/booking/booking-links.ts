import { addDays } from "../../dates/dates";
import { deriveStops, type StopDayInput } from "../../itinerary/stops";
import type { BookingSite } from "./booking-sites";
import { hotelFile, type LegFile } from "../overview/legs";

export type { BookingSite } from "./booking-sites";

export type BookingLink = { site: BookingSite; url: string };

export type BookedHotel = { id: number; name: string };

export type StayRow =
  | {
      kind: "stop";
      placeName: string;
      checkIn: string;
      checkOut: string;
      links: BookingLink[];
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

const FLIGHT_HOMES: BookingLink[] = [
  { site: "Kayak", url: "https://www.kayak.co.uk/flights" },
  { site: "Kiwi.com", url: "https://www.kiwi.com/en/" },
];

function skyscannerDays(outbound: string, inbound?: string): string {
  const url = new URL("https://www.skyscanner.net/g/referrals/v1/flights/day-view");
  url.searchParams.set("outboundDate", outbound);
  if (inbound) url.searchParams.set("inboundDate", inbound);
  return url.toString();
}

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

const HOSTELWORLD: BookingLink = { site: "Hostelworld", url: "https://www.hostelworld.com/" };

export function eventFlightLinks({
  origin,
  destination,
  date,
}: {
  origin: string;
  destination: string;
  date: string;
}): BookingLink[] | null {
  if (!origin || !destination) return null;
  return [
    { site: "Google Flights", url: googleFlights(`Flights from ${origin} to ${destination} on ${date}`) },
    { site: "Skyscanner", url: skyscannerDays(date) },
    ...FLIGHT_HOMES,
  ];
}

export function stayCheckOut(lastDay: string, tripLastDay: string | null): string {
  return lastDay === tripLastDay ? lastDay : addDays(lastDay, 1);
}

export function bookingPlan({
  trip,
  days,
  today,
  adults,
  files = [],
}: {
  trip: { startDate: string | null; endDate: string | null };
  days: StopDayInput[];
  today: string;
  adults: number;
  files?: (LegFile & { id: number; name: string })[];
}): BookingPlan | null {
  const { startDate, endDate } = trip;
  if (!startDate || !endDate || today >= startDate) return null;

  const stops = deriveStops(days, endDate);
  const firstPlace = stops.find((s) => s.placeName)?.placeName ?? null;
  const flights = flightLinks({ destination: firstPlace, start: startDate, end: endDate });
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
      links: stayLinks({ place: s.placeName, checkIn, checkOut, adults }),
      dayId: s.dayIds[0],
      hotel: booked ? { id: booked.id, name: booked.name } : null,
    };
  });
  return { flights, stays };
}
