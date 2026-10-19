import { COUNTRIES } from "@floc/core/people/countries";

import { codesAt, type Piece, type Spot } from "./land";

// A listing names the place a traveller would; the outline file holds states, under their full names.
const DRAWN_AS: Record<string, string> = { Scotland: "GB", "United States": "US" };
const BY_NAME = new Map(COUNTRIES.map(({ code, name }) => [name, code]));

/** The country code a listing's `country` is drawn under in `countries-110m.geojson`. */
export function outlineCode(country: string): string | null {
  return DRAWN_AS[country] ?? BY_NAME.get(country) ?? null;
}

/** The countries a listing names: one, or several for a trip across borders ("Vietnam, Cambodia, Thailand"). */
export const countryNames = (country: string) => country.split(", ");

/** Every country a trip's stops stand in, the first stop's first, and the listing's own countries even when a stop on the shore misses one. */
export function tripCodes(country: string, stops: readonly Spot[], land: readonly Piece[]): Set<string> {
  const codes = codesAt(land, stops);
  for (const name of countryNames(country)) {
    const own = outlineCode(name);
    if (own) codes.add(own);
  }
  return codes;
}
