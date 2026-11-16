import { COUNTRIES, readCountryCode } from "../../../people/countries";
import type { PresetTrip } from "../preset-trip-types";

const SAID_AS: Record<string, string> = { Scotland: "GB", "United States": "US" };

export function stopCountry(trip: Pick<PresetTrip, "country">, legCountry: string | undefined): string | null {
  if (legCountry) return readCountryCode(legCountry);
  return SAID_AS[trip.country] ?? COUNTRIES.find((c) => c.name === trip.country)?.code ?? null;
}
