export const HORIZON_DAYS = 9;

export type WeatherCondition = "sun" | "part" | "cloud" | "rain";

const SEVERITY: Record<WeatherCondition, number> = { sun: 0, part: 1, cloud: 2, rain: 3 };

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
