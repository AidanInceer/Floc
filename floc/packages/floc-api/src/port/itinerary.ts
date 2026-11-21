import type { LengthChoice, TripLength } from "@floc/core/dates/finding/trip-length";
import type { DayRemovalPlan } from "@floc/core/itinerary/day-removal";
import type { WeatherCondition } from "@floc/core/itinerary/weather";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";

export type DayEvent = {
  id: number;
  dayId: number;
  orderIndex: number;
  type: DayEventType;
  title: string | null;
  transportType: TransportType | null;
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

export type TripPlace = {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  countryCode: string | null;
};

export type PlaceHit = {
  providerId: string;
  name: string;
  label: string;
  lat: number;
  lng: number;
  countryCode: string | null;
};

export type OvernightPlace =
  | { placeId: number }
  | {
      name: string;
      providerId: string | null;
      lat: number | null;
      lng: number | null;
      countryCode: string | null;
    };

export type Availability = {
  userId: string;
  date: string;
  available: boolean;
  preferred: boolean;
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

export type TripForecastView = {
  locked: boolean;
  forecast: {
    placeName: string;
    from: string;
    horizonEnd: string;
    days: { date: string; condition: WeatherCondition; label: string; hi: number; lo: number }[];
    hourly: Record<string, { hour: string; condition: WeatherCondition; temp: number; rain: number }[]>;
  } | null;
};

export type ItineraryPort = {
  listDays(viewerId: string, tripId: number): Promise<ItineraryDay[]>;

  calendarFeedUrl(viewerId: string, tripId: number): Promise<string>;

  resetCalendarFeed(viewerId: string, tripId: number): Promise<string>;

  listPlaces(viewerId: string, tripId: number): Promise<TripPlace[]>;

  searchPlaces(viewerId: string, query: string): Promise<PlaceHit[]>;

  setOvernight(
    viewerId: string,
    tripId: number,
    input: { startDate: string; endDate: string; place: OvernightPlace | null },
  ): Promise<void>;

  listAvailability(viewerId: string, tripId: number): Promise<Availability[]>;

  listTripGuests(viewerId: string, tripId: number): Promise<{ id: string; name: string }[]>;

  loadTripForecast(viewerId: string, tripId: number): Promise<TripForecastView>;

  setAvailability(
    viewerId: string,
    tripId: number,
    dates: string[],
    available: boolean,
  ): Promise<void>;

  setPreferredDays(
    viewerId: string,
    tripId: number,
    dates: string[],
    preferred: boolean,
  ): Promise<void>;

  listLengthChoices(viewerId: string, tripId: number): Promise<LengthChoice[]>;

  setLengthChoice(
    viewerId: string,
    tripId: number,
    length: TripLength,
    picked: boolean,
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

  dayRemovalPlan(viewerId: string, tripId: number, dayId: number): Promise<DayRemovalPlan>;

  removeDay(viewerId: string, tripId: number, dayId: number): Promise<void>;
};
