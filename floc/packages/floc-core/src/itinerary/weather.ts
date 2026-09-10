/**
 * Pure half of the trip forecast (ticket 148): no I/O, so the server aggregate
 * and its tests share it. Open-Meteo's dozens of WMO codes collapse to four
 * buckets because the app draws four glyphs.
 */
import { addDays, type IsoDate } from "../dates/dates";

// Open-Meteo serves up to 16 days but the far end is noise; a fortnight is as
// far as we draw (ticket 148).
export const HORIZON_DAYS = 14;

export type WeatherCondition = "sun" | "part" | "cloud" | "rain";

// Snow (71–77, 85–86) is precipitation, so it's "rain" for v1. Unknown codes
// read as cloud, never a fabricated sun.
export function wmoToCondition(code: number): WeatherCondition {
  if (code === 0) return "sun";
  if (code === 1 || code === 2) return "part";
  if (code === 3 || code === 45 || code === 48) return "cloud";
  if (code >= 51) return "rain";
  return "cloud";
}

// Status is never colour (or a glyph) alone — the word travels with it.
export function conditionLabel(condition: WeatherCondition): string {
  switch (condition) {
    case "sun":
      return "Clear";
    case "part":
      return "Mostly sunny";
    case "cloud":
      return "Cloudy";
    case "rain":
      return "Light rain";
  }
}

// Half-open `[from, from + HORIZON_DAYS)`, so the last shown day is `from + 13`.
// String compare, no `Date`, no timezone (rule 10).
export function withinHorizon(date: IsoDate, from: IsoDate): boolean {
  return date >= from && date < addDays(from, HORIZON_DAYS);
}
