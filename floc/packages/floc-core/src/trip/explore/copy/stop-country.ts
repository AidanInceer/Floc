import { COUNTRIES, readCountryCode } from "../../../people/countries";
import type { PresetTrip } from "../preset-trip-types";

// Why: listings name a country as people say it; the code list names it as the ISO list does.
const SAID_AS: Record<string, string> = { Scotland: "GB", "United States": "US" };

/** The ISO code a copied stop gets, so it reaches the travel map. Null when nothing names one (rule 11). */
export function stopCountry(trip: Pick<PresetTrip, "country">, legCountry: string | undefined): string | null {
  if (legCountry) return readCountryCode(legCountry);
  return SAID_AS[trip.country] ?? COUNTRIES.find((c) => c.name === trip.country)?.code ?? null;
}
