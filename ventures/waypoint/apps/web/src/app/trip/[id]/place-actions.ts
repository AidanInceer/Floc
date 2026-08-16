"use server";

// The trip tabs' one place-search surface (ticket 110) — Route and Days
// previously duplicated this action, so the auth fix (ticket 104) had to land
// twice. Kept separate from server/places.ts because every export of a
// "use server" file is a public endpoint, and upsertPlace must stay internal.
import { requireUser } from "@/server/access";
import { searchPlaces, upsertPlace } from "@/server/places";

// Signed-in only (ticket 104) — unguarded, this was an open geocoding proxy
// billed to our Nominatim budget. requireUser not requireTripAccess: the
// picker searches before a trip is in scope, and place rows aren't trip-scoped.
export async function searchPlacesAction(query: string) {
  await requireUser();
  return searchPlaces(query);
}

export async function resolveEventPlace(input: {
  providerId: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
  countryCode?: string | null;
}) {
  // Gated as above, more sharply: this one writes place rows (ticket 104).
  await requireUser();
  if (!input.name.trim()) return null;
  return upsertPlace(input);
}
