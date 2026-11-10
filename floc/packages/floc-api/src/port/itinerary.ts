/** The itinerary half of the port (#573). The rules it carries are listed in `../port.ts`. */
import type { WeatherCondition } from "@floc/core/itinerary/weather";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";

export type DayEvent = {
  id: number;
  dayId: number;
  orderIndex: number;
  type: DayEventType;
  title: string | null;
  transportType: TransportType | null;
  /** `HH:MM`, local to the itinerary. Never an offset (rule 10). */
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  note: string | null;
  placeName: string | null;
};

export type ItineraryDay = {
  id: number;
  date: string;
  overnightPlaceId: number | null;
  overnightPlaceName: string | null;
  events: DayEvent[];
};

/**
 * A place the trip's days point at, for the map (#296). Not a stop — a stop is consecutive days
 * sharing an overnight place, derived by `@floc/core/stops` from `listDays` (rule 3).
 *
 * Why: `lat`/`lng` are nullable, because a place typed during a provider outage has none and
 * simply does not reach the map (rule 11).
 */
export type TripPlace = {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  /** ISO 3166-1 alpha-2, upper case. */
  countryCode: string | null;
};

/**
 * One hit from the geocoder (ticket 308). Not a `place` row — nothing is
 * written until it is chosen. An outage returns none of these, never a throw
 * (rule 11), so a client falls back to the name somebody typed.
 */
export type PlaceHit = {
  /** Provider-scoped stable id, e.g. `osm:relation:65606`. */
  providerId: string;
  name: string;
  /** Full display name, for telling two hits apart in a list. */
  label: string;
  lat: number;
  lng: number;
  countryCode: string | null;
};

/**
 * Where a run of days sleeps (ticket 308). Either a place this trip already
 * points at — which keeps its pin — or a fresh pick. Null clears the span.
 */
export type OvernightPlace =
  | { placeId: number }
  | {
      name: string;
      providerId: string | null;
      lat: number | null;
      lng: number | null;
      countryCode: string | null;
    };

/**
 * One person saying yes or no to one date (ticket 297).
 *
 * A `false` row is not the same as no row: it is "asked, said no", which the
 * Dates screen must be able to tell from "has not looked yet". Both read the
 * same to the maths in `@floc/core/availability`, and differently to a human.
 */
export type Availability = {
  userId: string;
  /** `YYYY-MM-DD`. No timezone, ever (rule 10). */
  date: string;
  available: boolean;
};

export type EventInput = {
  type: DayEventType;
  title: string;
  transportType: TransportType | null;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  note: string | null;
};

/** The Dates screen's Weather view (#148). `locked` says why a free trip has no forecast. */
export type TripForecastView = {
  locked: boolean;
  forecast: {
    placeName: string;
    from: string;
    horizonEnd: string;
    days: { date: string; condition: WeatherCondition; label: string; hi: number; lo: number }[];
    hourly: Record<string, { hour: string; condition: WeatherCondition; temp: number; pop: number }[]>;
  } | null;
};

export type ItineraryPort = {
  listDays(viewerId: string, tripId: number): Promise<ItineraryDay[]>;

  /**
   * The viewer's own subscribable `.ics` address for the trip (#334). Signed,
   * with no expiry; every poll re-checks live membership. Minted only after the
   * trip check passed.
   */
  calendarFeedUrl(viewerId: string, tripId: number): Promise<string>;

  /** A new feed address for the viewer only; every older one stops answering (#334). Returns the new one. */
  resetCalendarFeed(viewerId: string, tripId: number): Promise<string>;

  /** The distinct places the trip's days and events point at — for the map, not for stops (ticket 296). */
  listPlaces(viewerId: string, tripId: number): Promise<TripPlace[]>;

  /**
   * Geocoder search, signed in only (ticket 308) — unguarded this is an open
   * geocoding proxy on somebody else's budget. Not trip-scoped: the picker
   * searches before a trip is in scope, and `place` rows belong to no trip.
   */
  searchPlaces(viewerId: string, query: string): Promise<PlaceHit[]>;

  /**
   * Sets `overnight_place_id` on every day from `startDate` to `endDate`
   * (ticket 308). Day-first — no stop is written, ever (rule 3). A span that
   * covers no day of this trip is a no-op, not an error.
   */
  setOvernight(
    viewerId: string,
    tripId: number,
    input: { startDate: string; endDate: string; place: OvernightPlace | null },
  ): Promise<void>;

  /** Everyone's marks on the trip, `false` rows included (ticket 297). */
  listAvailability(viewerId: string, tripId: number): Promise<Availability[]>;

  /** People on the invite link who answered with a name and no account (#442, ADR-029). Not members; read-only here. */
  listTripGuests(viewerId: string, tripId: number): Promise<{ id: string; name: string }[]>;

  /** Null forecast on a free trip, however it asks — the gate is on the read (#248). */
  loadTripForecast(viewerId: string, tripId: number): Promise<TripForecastView>;

  /**
   * Sets the VIEWER'S OWN marks and nobody else's (ticket 297). There is no
   * parameter for whose they are, deliberately: availability is the one thing
   * on a trip an admin has no power over (rule 6).
   */
  setAvailability(
    viewerId: string,
    tripId: number,
    dates: string[],
    available: boolean,
  ): Promise<void>;

  addEvent(
    viewerId: string,
    tripId: number,
    dayId: number,
    input: EventInput,
  ): Promise<void>;

  updateEvent(
    viewerId: string,
    tripId: number,
    eventId: number,
    input: EventInput,
  ): Promise<void>;

  deleteEvent(viewerId: string, tripId: number, eventId: number): Promise<void>;
};
