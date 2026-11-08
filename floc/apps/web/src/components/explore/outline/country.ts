import { countryNames, listingCountryCode } from "@floc/core/trip/explore/listing-countries";

import { codesAt, type Piece, type Spot } from "./land";

export { countryNames };

/** The country code a listing's `country` is drawn under in `countries-110m.geojson`. */
export const outlineCode = listingCountryCode;

/** Every country a trip's stops stand in, the first stop's first, and the listing's own countries even when a stop on the shore misses one. */
export function tripCodes(country: string, stops: readonly Spot[], land: readonly Piece[]): Set<string> {
  const codes = codesAt(land, stops);
  for (const name of countryNames(country)) {
    const own = outlineCode(name);
    if (own) codes.add(own);
  }
  return codes;
}
