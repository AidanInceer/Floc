import { countryName } from "../people/countries";
import type { CountryMarkState } from "../vocabulary";

export type MapState = "green" | "yellow";

export type TravelMap = {
  states: Record<string, MapState>;
  manual: Record<string, CountryMarkState>;
  visited: number;
  wantToGo: number;
};

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

export function strongest(a: MapState | undefined, b: MapState): MapState {
  return a === "green" || b === "green" ? "green" : "yellow";
}

export function nextMark(current: MapState | undefined): MapState | "blank" {
  if (!current) return "yellow";
  return current === "yellow" ? "green" : "blank";
}

export function wantToGoCountries(map: Pick<TravelMap, "states">): { code: string; name: string }[] {
  return Object.entries(map.states)
    .filter(([, state]) => state === "yellow")
    .map(([code]) => ({ code, name: countryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
