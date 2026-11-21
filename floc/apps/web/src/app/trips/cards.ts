import "server-only";

import { listMembersFor, type TripMember } from "@/server/access";
import { readTripRoutes, type TripRoutes } from "@/server/itinerary/routes-for-trips";
import { listTripsFor } from "@/server/trips/trips";
import { hasEnded } from "@floc/core/dates/dates";
import { readTags } from "@floc/core/trip/tags";
import { readTripColor } from "@floc/core/trip/trip-color";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import type { TripCardData } from "@/components/trip/trip-card";

export type TripListCard = { card: TripCardData; members: TripMember[] };

export async function loadTripCards(
  viewerId: string,
  { archived }: { archived: boolean },
): Promise<TripListCard[]> {
  const rows = await listTripsFor(viewerId, { archived });
  const tripIds = rows.map((r) => r.id);

  const none: TripRoutes = { routes: new Map(), firstPlace: new Map() };
  const [membersByTrip, { routes, firstPlace: whereByTrip }] = await Promise.all([
    listMembersFor(tripIds),
    archived ? none : readTripRoutes(tripIds),
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
        needsYou: archived
          ? undefined
          : !hasEnded(r.endDate) &&
            !r.startDate &&
            !r.endDate &&
            !whereByTrip.has(r.id),
        where: whereByTrip.get(r.id) ?? null,
        tags: readTags(r.tags),
        color: readTripColor(r.colorKey),
        mark: readTripMark(r.mark),
        route: routes.get(r.id) ?? null,
      },
    };
  });
}
