import { COUNTRIES } from "../../people/countries";
import { countryRegion } from "./country-region";
import { PRESET_TRIPS, type PresetTrip, type Region } from "./preset-trips";

const NAMED_AS: Record<string, string> = { Scotland: "GB", "United States": "US" };
const BY_NAME = new Map(COUNTRIES.map(({ code, name }) => [name, code]));

export function listingCountryCode(country: string): string | null {
  return NAMED_AS[country] ?? BY_NAME.get(country) ?? null;
}

export const countryNames = (country: string) => country.split(", ");

export function listingsIn(code: string, trips: readonly PresetTrip[] = PRESET_TRIPS): PresetTrip[] {
  return trips.filter((trip) => countryNames(trip.country).some((name) => listingCountryCode(name) === code));
}

export function regionOf(code: string): Region | null {
  return countryRegion(code);
}
