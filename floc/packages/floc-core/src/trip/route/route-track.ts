// Why: the phone sends the day it took a position on, so "inside the trip" is a date compare, never a timezone (rule 10, ADR-026).
import { isIsoDate, type IsoDate } from "../../dates/dates";

export type TripDates = { startDate: IsoDate | null; endDate: IsoDate | null };
export type Position = { lat: number; lng: number; date: IsoDate; recordedAt: number };

/** How often the phone takes a position. */
export const POSITION_EVERY_MS = 5 * 60_000;
/** Positions in one upload: a day and a half offline at one every 5 minutes. */
export const MAX_BATCH = 500;
/** Why: a phone clock runs a little fast; a position an hour ahead is a wrong clock, not a fast one. */
const CLOCK_SLACK_MS = 5 * 60_000;

export function underway(trip: TripDates, today: IsoDate): boolean {
  return trip.startDate !== null && trip.endDate !== null && trip.startDate <= today && today <= trip.endDate;
}

export function acceptPositions<P extends Position>(positions: P[], trip: TripDates, now: number): P[] {
  return positions
    .filter(
      (p) =>
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lng) &&
        Math.abs(p.lat) <= 90 &&
        Math.abs(p.lng) <= 180 &&
        isIsoDate(p.date) &&
        underway(trip, p.date) &&
        Number.isFinite(p.recordedAt) &&
        p.recordedAt <= now + CLOCK_SLACK_MS,
    )
    .slice(0, MAX_BATCH);
}

export function positionAge(recordedAt: number, now: number): string {
  const minutes = Math.floor((now - recordedAt) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
