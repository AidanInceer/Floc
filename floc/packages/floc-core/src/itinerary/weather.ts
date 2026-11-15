/**
 * Pure half of the trip forecast (ticket 148): no I/O, so the server aggregate
 * and its tests share it. MET Norway's symbols collapse to four buckets because
 * the app draws four glyphs.
 */
// MET Norway forecasts about nine and a half days ahead; nine whole days is as far
// as we draw (#549 moved the forecast off Open-Meteo, whose free API is non-commercial).
export const HORIZON_DAYS = 9;

export type WeatherCondition = "sun" | "part" | "cloud" | "rain";

const SEVERITY: Record<WeatherCondition, number> = { sun: 0, part: 1, cloud: 2, rain: 3 };

// Snow, sleet and thunder are precipitation, so they're "rain" for v1. Unknown
// symbols read as cloud, never a fabricated sun.
export function symbolToCondition(symbol: string): WeatherCondition {
  const base = symbol.split("_")[0];
  if (/rain|sleet|snow|thunder/.test(base)) return "rain";
  if (base === "clearsky") return "sun";
  if (base === "fair" || base === "partlycloudy") return "part";
  return "cloud";
}

export function wetter(a: WeatherCondition, b: WeatherCondition): WeatherCondition {
  return SEVERITY[b] > SEVERITY[a] ? b : a;
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
