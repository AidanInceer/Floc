/** The day Days shows: the one asked for, else today while the trip runs, else the first. */
export function openingDay(dates: string[], requested: string | undefined, now: string): string {
  if (requested && dates.includes(requested)) return requested;
  return dates.includes(now) ? now : dates[0];
}
