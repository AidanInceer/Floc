import { COUNTRIES } from "@floc/core/people/countries";

// A listing names the place a traveller would; the outline file holds states.
const DRAWN_AS: Record<string, string> = { Scotland: "GB" };
const BY_NAME = new Map(COUNTRIES.map(({ code, name }) => [name, code]));

/** The country code a listing's `country` is drawn under in `countries-110m.geojson`. */
export function outlineCode(country: string): string | null {
  return DRAWN_AS[country] ?? BY_NAME.get(country) ?? null;
}
