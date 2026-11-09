import { COUNTRIES } from "../../people/countries";
import { countryRegion } from "./country-region";
import { PRESET_TRIPS, type PresetTrip, type Region } from "./preset-trips";

// A listing names the place a traveller would; the country list holds states, under their full names.
const NAMED_AS: Record<string, string> = { Scotland: "GB", "United States": "US" };
const BY_NAME = new Map(COUNTRIES.map(({ code, name }) => [name, code]));

export function listingCountryCode(country: string): string | null {
  return NAMED_AS[country] ?? BY_NAME.get(country) ?? null;
}

/** The countries a listing names: one, or several for a trip across borders ("Vietnam, Cambodia, Thailand"). */
export const countryNames = (country: string) => country.split(", ");

/** The Explore trips that go to a country, by its code: what a want-to-go country opens on Explore (#467). */
export function listingsIn(code: string, trips: readonly PresetTrip[] = PRESET_TRIPS): PresetTrip[] {
  return trips.filter((trip) => countryNames(trip.country).some((name) => listingCountryCode(name) === code));
}

/** A country's region: its continent's colour on Explore, whether or not a trip goes there (#467). */
export function regionOf(code: string): Region | null {
  return countryRegion(code);
}
