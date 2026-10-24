import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { routePoint } from "@/db/schema";
import type { TripAccess } from "@/server/access";
import { bounded, LIMITS } from "@/server/limits";
import { underway } from "@floc/core/trip/route/route-track";
import type { IsoDate } from "@floc/core/dates/dates";

export type GroupRoute = {
  userId: string;
  name: string;
  tone: string;
  /** [lng, lat] in time order, the way a map line takes it. */
  path: [number, number][];
  /** The newest position, only while the trip runs: a precise "where now" has no use after it (ADR-026). */
  live: { lat: number; lng: number; recordedAt: number } | null;
};

/** Current members only: a member who left takes their place on the map with them. */
export async function groupRoutes(access: TripAccess, today: IsoDate): Promise<GroupRoute[]> {
  const rows = bounded(
    await db
      .select({ userId: routePoint.userId, lat: routePoint.lat, lng: routePoint.lng, recordedAt: routePoint.recordedAt })
      .from(routePoint)
      .where(eq(routePoint.tripId, access.trip.id))
      .orderBy(asc(routePoint.recordedAt))
      .limit(LIMITS.routePoints)
      .all(),
    "routePoints",
    `trip ${access.trip.id}`,
  );
  const live = underway(access.trip, today);

  return access.members.flatMap((member) => {
    const mine = rows.filter((r) => r.userId === member.userId);
    const last = mine.at(-1);
    if (!last) return [];
    return [
      {
        userId: member.userId,
        name: member.name,
        tone: member.tone,
        path: mine.map((r) => [r.lng, r.lat] as [number, number]),
        live: live ? { lat: last.lat, lng: last.lng, recordedAt: last.recordedAt.getTime() } : null,
      },
    ];
  });
}
