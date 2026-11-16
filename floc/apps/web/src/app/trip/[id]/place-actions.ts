"use server";

import { requireUser } from "@/server/access";
import { searchPlaces } from "@/server/itinerary/places";

export async function searchPlacesAction(query: string) {
  const viewer = await requireUser();
  return searchPlaces(query, viewer.id);
}
