"use server";

// The trip tabs' one place-search surface (ticket 110). Every export of a
// "use server" file is a public endpoint, so writing a place stays in server/.
import { requireUser } from "@/server/access";
import { searchPlaces } from "@/server/itinerary/places";

// Signed-in only (ticket 104) — unguarded, this was an open geocoding proxy
// billed to our Nominatim budget. requireUser not requireTripAccess: the
// picker searches before a trip is in scope, and place rows aren't trip-scoped.
export async function searchPlacesAction(query: string) {
  const viewer = await requireUser();
  return searchPlaces(query, viewer.id);
}
