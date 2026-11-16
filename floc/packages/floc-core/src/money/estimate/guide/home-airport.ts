import { HOME_AIRPORTS, HUBS } from "./price-guide";

export type FlightSeen = { tripId: number; date: string | null; from: string | null };

export const isAirportCode = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z]{3}$/.test(value);

export function inferHomeAirport(flights: FlightSeen[]): string | null {
  const tally = new Map<string, Tally>();
  for (const { date, from } of firstFlights(flights).values()) {
    const t = tally.get(from) ?? { count: 0, latest: "" };
    tally.set(from, { count: t.count + 1, latest: date > t.latest ? date : t.latest });
  }
  let best: [string, Tally] | null = null;
  for (const entry of tally) if (!best || beats(entry[1], best[1])) best = entry;
  return best ? best[0] : null;
}

type Tally = { count: number; latest: string };
const beats = (a: Tally, b: Tally) => a.count > b.count || (a.count === b.count && a.latest > b.latest);

function firstFlights(flights: FlightSeen[]): Map<number, { date: string; from: string }> {
  const first = new Map<number, { date: string; from: string }>();
  for (const f of flights) {
    if (!f.date || !isAirportCode(f.from)) continue;
    const held = first.get(f.tripId);
    if (!held || f.date < held.date) first.set(f.tripId, { date: f.date, from: f.from.toUpperCase() });
  }
  return first;
}

const NAMES = new Map<string, string>([
  ...HOME_AIRPORTS.map((a) => [a.code, a.name] as const),
  ...HUBS.map((h) => [h.code, h.city] as const),
]);

export function airportName(code: string): string {
  return NAMES.get(code.toUpperCase()) ?? code.toUpperCase();
}
