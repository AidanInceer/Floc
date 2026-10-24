import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { tripMembership } from "@/db/schema";
import type { TripAccess } from "@/server/access";
import { underway } from "@floc/core/trip/route/route-track";
import type { IsoDate } from "@floc/core/dates/dates";

export type RouteSwitch = { on: boolean; underway: boolean };

export async function routeSwitch(access: TripAccess, today: IsoDate): Promise<RouteSwitch> {
  return { on: await routeOn(access), underway: underway(access.trip, today) };
}

export async function routeOn(access: TripAccess): Promise<boolean> {
  const row = await db
    .select({ on: tripMembership.routeOnAt })
    .from(tripMembership)
    .where(mine(access))
    .get();
  return Boolean(row?.on);
}

export async function setRouteOn(access: TripAccess, on: boolean): Promise<void> {
  await db
    .update(tripMembership)
    .set({ routeOnAt: on ? new Date() : null, lastModifiedAt: new Date() })
    .where(mine(access));
}

function mine(access: TripAccess) {
  return and(
    eq(tripMembership.tripId, access.trip.id),
    eq(tripMembership.userId, access.viewer.id),
    isNull(tripMembership.deletedAt),
  );
}
