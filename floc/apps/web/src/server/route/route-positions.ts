import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { routePoint } from "@/db/schema";
import type { TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { acceptPositions, type Position } from "@floc/core/trip/route/route-track";

import { routeOn } from "./route-switch";

/** How many were new. Off, or outside the trip's dates, keeps nothing (ADR-026). */
export async function recordPositions(access: TripAccess, positions: Position[], now: number): Promise<number> {
  const kept = (await routeOn(access)) ? acceptPositions(positions, access.trip, now) : [];
  if (kept.length === 0) return 0;
  const rows = await db
    .insert(routePoint)
    .values(
      kept.map((p) => ({
        tripId: access.trip.id,
        userId: access.viewer.id,
        lat: p.lat,
        lng: p.lng,
        date: p.date,
        recordedAt: new Date(p.recordedAt),
      })),
    )
    .onConflictDoNothing()
    .returning({ id: routePoint.id })
    .all();
  return rows.length;
}

/** For good, for everyone: the exception ADR-026 makes to rule 8. */
export async function deleteMyRoute(access: TripAccess): Promise<void> {
  await db
    .delete(routePoint)
    .where(and(eq(routePoint.tripId, access.trip.id), eq(routePoint.userId, access.viewer.id)));
  refresh({ kind: "tripOverview", tripId: access.trip.id });
}
