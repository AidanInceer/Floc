export const TRIP_LENGTHS = ["long_weekend", "short_break", "week", "longer"] as const;

export type TripLength = (typeof TRIP_LENGTHS)[number];

export const TRIP_LENGTH_SPECS: Record<TripLength, { label: string; nights: string; min: number; max: number }> = {
  long_weekend: { label: "Long weekend", nights: "2–3 nights", min: 2, max: 3 },
  short_break: { label: "Short break", nights: "4–5 nights", min: 4, max: 5 },
  week: { label: "A week", nights: "6–8 nights", min: 6, max: 8 },
  longer: { label: "Longer", nights: "9+ nights", min: 9, max: 14 },
};

export type LengthChoice = { userId: string; length: TripLength };

export function isTripLength(value: unknown): value is TripLength {
  return TRIP_LENGTHS.includes(value as TripLength);
}

export function picksLength(choices: LengthChoice[], userId: string, length: TripLength): boolean {
  return choices.some((c) => c.userId === userId && c.length === length);
}

export function lengthSummary(choices: LengthChoice[]): string {
  const people = new Set(choices.map((c) => c.userId)).size;
  if (people < 2) return "";
  const tally = TRIP_LENGTHS.map((length) => ({ length, can: choices.filter((c) => c.length === length).length }));
  const best = tally.reduce((a, b) => (b.can > a.can ? b : a), tally[0]);
  const suits = best.can === people ? `all ${people}` : `${best.can} of ${people}`;
  return `${TRIP_LENGTH_SPECS[best.length].label} suits ${suits}.`;
}
