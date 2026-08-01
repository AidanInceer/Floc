"use server";

/**
 * The trip tabs' one place-search surface (ticket 110).
 *
 * `searchPlacesAction` used to exist byte-identically in `route/actions.ts` and
 * `days/actions.ts`. That is not a tidiness complaint: the missing-auth fix on
 * these actions (ticket 104) had to land twice or not at all, and two entry
 * points onto the same Nominatim budget is two things to remember.
 *
 * Why here and not in `server/places.ts`, where the rest of the geocoding
 * lives: every export of a `"use server"` file is a public endpoint, and
 * `upsertPlace` must stay callable from `route/actions.ts` *without* becoming
 * one. So `server/places.ts` owns the provider — throttle, fetch, parsing,
 * upsert — and this file is the only place any of it is exposed to a browser.
 * It sits at `trip/[id]/` because Route and Days are its only callers.
 */
import { requireUser } from "@/server/access";
import { searchPlaces, upsertPlace } from "@/server/places";

/**
 * Free-text place search for `<PlacePicker>` (a Client Component, which can
 * only reach the server through a `"use server"` function — no client fetch to
 * our own API, per the venture conventions).
 *
 * Signed-in only (ticket 104): unguarded, this was an open geocoding proxy
 * billed to our Nominatim budget by anyone who could name the action.
 * `requireUser` rather than `requireTripAccess` — the picker searches before a
 * trip is in scope, and `place` rows are not trip-scoped data.
 *
 * Never throws on a provider failure: `searchPlaces` degrades to an empty list
 * so the picker falls back to a typed place name (CLAUDE.md rule 11).
 */
export async function searchPlacesAction(query: string) {
  await requireUser();
  return searchPlaces(query);
}

/** Resolves a free-text or geocoded place into a `place.id` for an event. */
export async function resolveEventPlace(input: {
  providerId: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
  countryCode?: string | null;
}) {
  // Gated for the same reason as the search above, and more sharply: this one
  // *writes* `place` rows (ticket 104).
  await requireUser();
  if (!input.name.trim()) return null;
  return upsertPlace(input);
}
