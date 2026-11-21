import { shortPlace } from "../names/place-name";

export type NightPlace<P> = { date: string; place: P | null };

const FEW_STOPS = 3;

export function placeForEachNight<P>(nights: NightPlace<P>[]): Map<string, P> {
  const first = nights.find((n) => n.place !== null)?.place ?? null;
  const out = new Map<string, P>();
  if (first === null) return out;
  let current: P = first;
  for (const night of nights) {
    if (night.place !== null) current = night.place;
    out.set(night.date, current);
  }
  return out;
}

export function forecastTitle(placeNames: string[]): string {
  const route = placeNames
    .map(shortPlace)
    .filter((name, i, all) => i === 0 || name !== all[i - 1]);
  if (route.length > FEW_STOPS) return `${route.length} stops`;
  return route.join(" → ");
}

export function stopStarts(days: { date: string; placeName: string }[]): Set<string> {
  if (new Set(days.map((d) => d.placeName)).size < 2) return new Set();
  return new Set(days.filter((d, i) => i === 0 || d.placeName !== days[i - 1].placeName).map((d) => d.date));
}
