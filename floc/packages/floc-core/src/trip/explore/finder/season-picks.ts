import type { PresetTrip, Region } from "../preset-trip-types";
import { monthsOf } from "./best-months";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SEASON_LENGTH = 3;
const PICK_LIMIT = 9;
const PER_REGION = 2;

/** The three months after this one, 1–12: November gives December, January, February. */
export function comingSeason(month: number): number[] {
  return Array.from({ length: SEASON_LENGTH }, (_, i) => ((month + i) % 12) + 1);
}

/** "December to February". */
export const seasonWords = (months: readonly number[]) => `${MONTH_NAMES[months[0] - 1]} to ${MONTH_NAMES[months[months.length - 1] - 1]}`;

/**
 * This season's top picks, by a fixed rule (#624): good in every month of the season, the shortest season first
 * (now or never), regions in turn so the first few are from different places, two a region at most, nine in all.
 * Why: a rule, not a hand pick or a count of saves, so a pick is never bought (ADR-013) and never a popularity score (ADR-042).
 */
export function seasonPicks(trips: readonly PresetTrip[], months: readonly number[]): PresetTrip[] {
  const fit = trips
    .map((trip) => ({ trip, good: monthsOf(trip.bestMonths) }))
    .filter(({ good }) => months.every((m) => good.includes(m)))
    .sort((a, b) => a.good.length - b.good.length || a.trip.id.localeCompare(b.trip.id));
  const byRegion = new Map<Region, PresetTrip[]>();
  for (const { trip } of fit) byRegion.set(trip.region, [...(byRegion.get(trip.region) ?? []), trip]);
  const picks: PresetTrip[] = [];
  for (let round = 0; round < PER_REGION; round++) {
    for (const list of byRegion.values()) if (list[round] && picks.length < PICK_LIMIT) picks.push(list[round]);
  }
  return picks;
}
