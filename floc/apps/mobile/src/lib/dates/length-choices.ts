import { TRIP_LENGTHS, picksLength, type LengthChoice, type TripLength } from "@floc/core/dates/finding/trip-length";

export type LengthPicks = Record<TripLength, boolean>;

export function picksOf(choices: LengthChoice[], viewerId: string): LengthPicks {
  return Object.fromEntries(TRIP_LENGTHS.map((length) => [length, picksLength(choices, viewerId, length)])) as LengthPicks;
}

export function withPicks(choices: LengthChoice[], viewerId: string, mine: LengthPicks): LengthChoice[] {
  const own = TRIP_LENGTHS.filter((length) => mine[length]).map((length) => ({ userId: viewerId, length }));
  return [...choices.filter((c) => c.userId !== viewerId), ...own];
}
