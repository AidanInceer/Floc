import "server-only";

import { requireTripEdit, type TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { AlreadyRemoved } from "@/server/removed-rows";

export async function editTrip<T>(
  tripId: number,
  area: "itinerary" | "packing",
  work: (access: TripAccess) => Promise<T>,
): Promise<T | undefined> {
  const access = await requireTripEdit(tripId);
  try {
    return await work(access);
  } catch (error) {
    if (!(error instanceof AlreadyRemoved)) throw error;
    refresh({ kind: area, tripId: access.trip.id });
    return undefined;
  }
}
