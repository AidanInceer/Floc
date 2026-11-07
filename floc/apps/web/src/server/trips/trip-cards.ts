import type { TripSummary } from "@floc/api/port";
import { hasEnded } from "@floc/core/dates/dates";

import { listMembersFor } from "@/server/access";
import { firstOvernightPlaceByTrip } from "@/server/itinerary/itinerary";
import { listTripsFor } from "@/server/trips/trips";

/** Why: the web card's faces, place and "Needs you" (`app/trips/cards.ts`), built the same way for the phone. */
export async function listTripCards(viewerId: string, { archived }: { archived: boolean }): Promise<TripSummary[]> {
  const rows = await listTripsFor(viewerId, { archived });
  const ids = rows.map((row) => row.id);
  const [membersByTrip, whereByTrip] = await Promise.all([
    listMembersFor(ids),
    archived ? new Map<number, string>() : firstOvernightPlaceByTrip(ids),
  ]);
  return rows.map((row) => ({
    ...row,
    members: (membersByTrip.get(row.id) ?? []).map(({ userId, name, avatarIcon, tone }) => ({ userId, name, avatarIcon, tone })),
    needsYou: !archived && !hasEnded(row.endDate) && !row.startDate && !row.endDate && !whereByTrip.has(row.id),
    where: whereByTrip.get(row.id) ?? null,
  }));
}
