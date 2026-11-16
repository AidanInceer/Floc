import { countryNames, listingCountryCode } from "@floc/core/trip/explore/listing-countries";

import { codesAt, type Piece, type Spot } from "./land";

export { countryNames };

export const outlineCode = listingCountryCode;

export function tripCodes(country: string, stops: readonly Spot[], land: readonly Piece[]): Set<string> {
  const codes = codesAt(land, stops);
  for (const name of countryNames(country)) {
    const own = outlineCode(name);
    if (own) codes.add(own);
  }
  return codes;
}
