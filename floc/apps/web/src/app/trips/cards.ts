/**
 * Load-and-build shared by /trips and /trips/archived — one predicate
 * argument instead of duplicating the assembly. Not in `server/`: this is
 * the card shape two pages in this folder share, not a domain aggregate.
 *
 * Archived loads less: the Place sort is live-list furniture, so that read
 * only fires for the live list.
 */
import "server-only";

import { listMembersFor, type TripMember } from "@/server/access";
import { firstOvernightPlaceByTrip } from "@/server/itinerary/itinerary";
import { listTripsFor } from "@/server/trips/trips";
import { hasEnded } from "@floc/core/dates/dates";
import { readTags } from "@floc/core/trip/tags";
import { readTripColor } from "@floc/core/trip/trip-color";
import type { TripCardData } from "@/components/trip/trip-card";

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
  const [membersByTrip, whereByTrip] = await Promise.all([
    listMembersFor(tripIds),
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
        starred: r.starred,
        muted: r.muted,
        members,
        // A trip nobody has decided anything about yet — no window, nowhere to
        // stay. Read off rows already loaded, so it costs no extra query.
        needsYou: archived
          ? undefined
          : !hasEnded(r.endDate) &&
            !r.startDate &&
            !r.endDate &&
            !whereByTrip.has(r.id),
        where: whereByTrip.get(r.id) ?? null,
        tags: readTags(r.tags),
        color: readTripColor(r.colorKey),
      },
    };
  });
}
