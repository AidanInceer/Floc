import { nightsBetween } from "../../../dates/dates";
import { deriveStops } from "../../../itinerary/stops";
import type { GuideStop } from "./guide";

export type ShapeDay = {
  dayId: number;
  date: string;
  overnightPlaceId: number | null;
  placeName: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
};

export const ASSUMED_NIGHTS = 7;
export type Nights = { count: number; from: "dates" | "days" | "chosen" | "assumed" };

/** How long a trip is and where it sleeps, for its estimate (#574). An undated trip still gets one (rule 9). */
export function tripShape(args: { start: string | null; end: string | null; days: ShapeDay[]; chosenNights: number | null }): {
  nights: Nights;
  stops: GuideStop[];
} {
  const where = new Map(args.days.map((d) => [d.overnightPlaceId, d]));
  const stops = deriveStops(
    args.days.map((d) => ({ dayId: d.dayId, date: d.date, overnightPlaceId: d.overnightPlaceId, overnightPlaceName: d.placeName })),
    args.end,
  )
    .flatMap((s): GuideStop[] => {
      const d = s.placeId === null ? undefined : where.get(s.placeId);
      return d ? [{ name: d.placeName, countryCode: d.countryCode, lat: d.lat, lng: d.lng, nights: s.nights }] : [];
    });
  return { nights: nightsOf(args), stops };
}

function nightsOf(args: { start: string | null; end: string | null; days: ShapeDay[]; chosenNights: number | null }): Nights {
  if (args.start && args.end) return { count: Math.max(nightsBetween(args.start, args.end), 0), from: "dates" };
  if (args.days.length > 1) return { count: args.days.length - 1, from: "days" };
  if (args.chosenNights != null) return { count: args.chosenNights, from: "chosen" };
  return { count: ASSUMED_NIGHTS, from: "assumed" };
}
