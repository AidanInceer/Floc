/**
 * Load-and-build shared by /trips and /trips/archived — one predicate
 * argument instead of duplicating the assembly. Not in `server/`: this is
 * the card shape two pages in this folder share, not a domain aggregate.
 *
 * Archived loads less: "needs you" and the Place sort are live-list
 * furniture, so those two reads only fire for the live list.
 */
import "server-only";

import { listMembersFor, type TripMember } from "@/server/access";
import { tripIdsWithIdeas } from "@/server/ideas";
import { firstOvernightPlaceByTrip } from "@/server/itinerary";
import { listTripsFor } from "@/server/trips";
import { hasEnded } from "@/lib/dates";
import { readTags } from "@/lib/tags";
import { readTripColor } from "@/lib/trip-color";
import type { TripCardData } from "@/components/trip-card";

// Card plus the roster it was built from — Archived names the admins to ask
// for a restore. `TripCardData.members` is deliberately narrower (avatar row
// only).
export type TripListCard = { card: TripCardData; members: TripMember[] };

export async function loadTripCards(
  viewerId: string,
  { archived }: { archived: boolean },
): Promise<TripListCard[]> {
  const rows = await listTripsFor(viewerId, { archived });
  const tripIds = rows.map((r) => r.id);

  // One query for the whole list each, not one per card.
  const [membersByTrip, tripsWithIdeas, whereByTrip] = await Promise.all([
    listMembersFor(tripIds),
    archived ? new Set<number>() : tripIdsWithIdeas(tripIds),
    archived ? new Map<number, string>() : firstOvernightPlaceByTrip(tripIds),
  ]);

  return rows.map((r) => {
    const members = membersByTrip.get(r.id) ?? [];
    return {
      members,
      card: {
        id: r.id,
        name: r.name,
        startDate: r.startDate,
        endDate: r.endDate,
        role: r.role,
        members,
        // Cheapest signal a fresh trip has: an empty idea board.
        needsYou: archived
          ? undefined
          : !hasEnded(r.endDate) && !tripsWithIdeas.has(r.id),
        where: whereByTrip.get(r.id) ?? null,
        tags: readTags(r.tags),
        color: readTripColor(r.colorKey),
      },
    };
  });
}
