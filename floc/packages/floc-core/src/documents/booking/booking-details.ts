/**
 * What Floc read from a booking (#559): the few fields that pre-fill a Days event or a stay.
 *
 * Why every field is checked here: the values come out of a forwarded mail or a barcode, which
 * anyone can craft. Nothing reaches the database or a screen that is not a real date, a clock
 * time, an airport code, a flight number, or short plain text.
 */
import { isIsoDate, type IsoDate } from "../../dates/dates";
import type { DocCategory } from "../documents";

export type FlightDetails = {
  kind: "flight";
  flightNumber: string | null;
  date: IsoDate | null;
  from: string | null;
  to: string | null;
  departTime: string | null;
  arriveTime: string | null;
  reference: string | null;
};

export type HotelDetails = {
  kind: "hotel";
  name: string | null;
  checkIn: IsoDate | null;
  checkOut: IsoDate | null;
  reference: string | null;
};

export type BookingDetails = FlightDetails | HotelDetails;

const MAX_STORED_LENGTH = 1000;
const NAME_CAP = 80;

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function date(value: unknown): IsoDate | null {
  const day = text(value).slice(0, 10);
  return isIsoDate(day) ? day : null;
}

/** HH:MM off a clock time or an ISO date-time, as written: no timezone is kept (rule 10). */
function time(value: unknown): string | null {
  const match = /(?:^|T)([01]\d|2[0-3]):([0-5]\d)/.exec(text(value));
  return match ? `${match[1]}:${match[2]}` : null;
}

function airport(value: unknown): string | null {
  const code = text(value).toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

function flightNumber(value: unknown): string | null {
  const match = /^([A-Z]{3}|[A-Z][A-Z0-9]|[0-9][A-Z])\s?0*(\d{1,4})[A-Z]?$/.exec(text(value).toUpperCase());
  return match ? `${match[1]} ${match[2]}` : null;
}

function reference(value: unknown): string | null {
  const ref = text(value).toUpperCase();
  return /^[A-Z0-9][A-Z0-9.-]{3,19}$/.test(ref) ? ref : null;
}

/** Why: a name is shown on screen, so it carries no markup, control character or line break. */
function plainName(value: unknown): string | null {
  const name = text(value)
    .replace(/[<>\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_CAP)
    .trim();
  return name || null;
}

type Loose = Record<string, unknown>;

function flight(raw: Loose): FlightDetails | null {
  const details: FlightDetails = {
    kind: "flight",
    flightNumber: flightNumber(raw.flightNumber),
    date: date(raw.date),
    from: airport(raw.from),
    to: airport(raw.to),
    departTime: time(raw.departTime),
    arriveTime: time(raw.arriveTime),
    reference: reference(raw.reference),
  };
  return details.flightNumber || details.date || (details.from && details.to) ? details : null;
}

function hotel(raw: Loose): HotelDetails | null {
  const checkIn = date(raw.checkIn);
  const checkOut = date(raw.checkOut);
  const details: HotelDetails = {
    kind: "hotel",
    name: plainName(raw.name),
    checkIn,
    checkOut: checkIn && checkOut && checkOut > checkIn ? checkOut : null,
    reference: reference(raw.reference),
  };
  return details.name || details.checkIn ? details : null;
}

/** The checked details, or null when nothing useful is left. */
export function cleanBookingDetails(raw: unknown): BookingDetails | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const loose = raw as Loose;
  if (loose.kind === "flight") return flight(loose);
  if (loose.kind === "hotel") return hotel(loose);
  return null;
}

/** Off the stored column: a bad or oversized value reads as nothing read. */
export function parseBookingDetails(stored: unknown): BookingDetails | null {
  if (typeof stored !== "string" || !stored || stored.length > MAX_STORED_LENGTH) return null;
  try {
    return cleanBookingDetails(JSON.parse(stored));
  } catch {
    return null;
  }
}

export function storeBookingDetails(details: BookingDetails | null): string | null {
  return details ? JSON.stringify(details) : null;
}

export function bookingCategory(details: BookingDetails): DocCategory {
  return details.kind === "flight" ? "travel" : "hotel";
}

/** The days the booking covers, for finding its trip. Null when it carries no date. */
export function bookingDates(details: BookingDetails): { start: IsoDate; end: IsoDate } | null {
  if (details.kind === "flight") return details.date ? { start: details.date, end: details.date } : null;
  if (!details.checkIn) return null;
  return { start: details.checkIn, end: details.checkOut ?? details.checkIn };
}

/** One line for a file row: "FR 1234 · STN → OPO", or the hotel's name. */
export function bookingSummary(details: BookingDetails): string {
  if (details.kind === "hotel") return details.name ?? "Hotel booking";
  const route = details.from && details.to ? `${details.from} → ${details.to}` : null;
  return [details.flightNumber, route].filter(Boolean).join(" · ") || "Flight";
}

/** The title a pre-filled transport event starts with. */
export function flightTitle(details: FlightDetails): string {
  const route = details.from && details.to ? `${details.from} to ${details.to}` : null;
  return [details.flightNumber, route].filter(Boolean).join(" · ") || "Flight";
}
