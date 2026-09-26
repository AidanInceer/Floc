/**
 * The travel map's pure half (ticket 95), importable from a Client Component
 * — queries live in `server/itinerary/travel-map.ts` (ticket 107).
 *
 * Trip marks are derived on read, never stored: green is triggered by
 * `hasEnded`, i.e. time passing rather than a write, so there's no event to
 * materialise on and deriving is always right. What *is* stored is the
 * hand-painted marks in `user_country_mark`, which win permanently — a `none`
 * row means "no, I didn't go", taking back a trip's claim after the fact.
 */
import type { CountryMarkState } from "../vocabulary";

/** What a country can look like on the drawing. Absent means unpainted. */
export type MapState = "green" | "yellow";

export type TravelMap = {
  /** Country code → colour, trips and hand merged. The thing that gets drawn. */
  states: Record<string, MapState>;
  /**
   * The hand-painted rows on their own, `none` included — the editor needs
   * them to know what clicking again should do next.
   */
  manual: Record<string, CountryMarkState>;
  visited: number;
  wantToGo: number;
};

/**
 * Trip marks + hand marks → what's drawn. Green beats yellow when trips
 * disagree (been-there outranks want-to-go); a hand mark wins outright,
 * `none` included, ignoring the trips entirely.
 */
export function mergeMarks(
  derived: Record<string, MapState>,
  manual: Record<string, CountryMarkState>,
): TravelMap {
  const states: Record<string, MapState> = {};

  for (const [code, state] of Object.entries(derived)) {
    if (code in manual) continue;
    states[code] = state;
  }
  for (const [code, state] of Object.entries(manual)) {
    if (state !== "none") states[code] = state;
  }

  const values = Object.values(states);
  return {
    states,
    manual,
    visited: values.filter((s) => s === "green").length,
    wantToGo: values.filter((s) => s === "yellow").length,
  };
}

/** Green wins — see `mergeMarks`. Used while folding rows together. */
export function strongest(a: MapState | undefined, b: MapState): MapState {
  return a === "green" || b === "green" ? "green" : "yellow";
}

/** What a tap does to a country: blank → yellow → green → blank. Want-to-go first: it's the commoner mark. */
export function nextMark(current: MapState | undefined): MapState | "blank" {
  if (!current) return "yellow";
  return current === "yellow" ? "green" : "blank";
}
