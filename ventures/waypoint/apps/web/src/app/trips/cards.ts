/**
 * The load-and-build behind both trip lists (ticket 117, S2).
 *
 * `/trips` and `/trips/archived` were the same forty lines twice, differing in
 * one predicate — so the predicate is the argument and the assembly happens
 * once. Not in `server/`: the reads there are the aggregates' (ticket 118);
 * *this* is the card shape two pages in the same folder happen to share, which
 * is exactly the coupling a route-local module is for.
 *
 * The archived list deliberately loads less. "Needs you" and the Place sort are
 * live-list furniture — an archived trip is not waiting on anybody and isn't
 * being sorted by where it was — so those two reads only fire for the live one
 * rather than being fetched and thrown away.
 */
import "server-only";

import { listMembersFor, type TripMember } from "@/server/access";
import { tripIdsWithIdeas } from "@/server/ideas";
import { firstOvernightPlaceByTrip } from "@/server/itinerary";
import { listTripsFor } from "@/server/membership";
import { hasEnded } from "@/lib/dates";
import { readTags } from "@/lib/tags";
import type { TripCardData } from "@/components/trip-card";

/**
 * The card, plus the roster it was built from — Archived names the admins to
 * ask for a restore, and `TripCardData.members` is deliberately narrower than
 * the roster (it's what an avatar row needs, nothing more).
 */
export type TripListCard = { card: TripCardData; members: TripMember[] };

export async function loadTripCards(
  viewerId: string,
  { archived }: { archived: boolean },
): Promise<TripListCard[]> {
  const rows = await listTripsFor(viewerId, { archived });
  const tripIds = rows.map((r) => r.id);

  // All three depend on `tripIds` and on nothing else, so they go out together
  // rather than one after the other. Each is one query for the whole list, not
  // one per card.
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
        // The idea probe is the cheapest signal a fresh trip has: an empty
        // board is the one thing every one of them shares (ticket 17 asks for
        // "cheap", not "complete").
        needsYou: archived
          ? undefined
          : !hasEnded(r.endDate) && !tripsWithIdeas.has(r.id),
        where: whereByTrip.get(r.id) ?? null,
        tags: readTags(r.tags),
      },
    };
  });
}
