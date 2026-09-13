/**
 * The `trip` row itself — what a trip *is*: its name, window, tags, colour and
 * its two lifecycle marks (ticket 242, split out of the old membership file).
 *
 * Who is on it lives in `roster.ts`, who was asked in `invites.ts`, and who can
 * make which dates in `availability.ts`. Only `listTripsFor` reaches across, to
 * ask which trips are yours — nothing here writes a row it does not own.
 */
import "server-only";

import { and, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripMembership } from "@/db/schema";
import type { TripRole } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

export type TripListRow = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  colorKey: string | null;
  role: TripRole;
  starred: boolean;
};

/** `archived` is a param so /trips and /trips/archived share one query (ticket 118). */
export async function listTripsFor(
  userId: string,
  { archived }: { archived: boolean },
): Promise<TripListRow[]> {
  const rows = await db
    .select({
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      tags: trip.tags,
      colorKey: trip.colorKey,
      role: tripMembership.role,
      starredAt: tripMembership.starredAt,
    })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(
      and(
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
        isNull(trip.deletedAt),
        archived ? isNotNull(trip.archivedAt) : isNull(trip.archivedAt),
      ),
    )
    .limit(LIMITS.tripsPerUser)
    .all();
  return bounded(rows, "tripsPerUser", `user ${userId}`).map(({ starredAt, ...row }) => ({
    ...row,
    starred: starredAt !== null,
  }));
}

/** Only the viewer's own membership row, so a star never reaches anyone else. */
export async function setTripStarred(tripId: number, userId: string, starred: boolean) {
  await db
    .update(tripMembership)
    .set({ starredAt: starred ? new Date() : null, ...touch() })
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
      ),
    );
}

/** Smallest thing that exists at creation (ticket 01). */
export async function createTripWithAdmin(input: {
  name: string;
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
}): Promise<number> {
  const [created] = await db
    .insert(trip)
    .values({
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      createdBy: input.createdBy,
      inviteToken: crypto.randomUUID(), // unguessable, never derived from id (ticket 05)
    })
    .returning({ id: trip.id });

  await db.insert(tripMembership).values({
    tripId: created.id,
    userId: input.createdBy,
    role: "admin",
  });

  return created.id;
}

/**
 * A patch of the trip's own fields — one function rather than one per field,
 * since the shared `last_modified_at` stamp is the only rule they had in common
 * (same shape as `updateProfileFields`). A key left out is left alone; `null` is
 * a real value, since both dates and the colour clear back to a default (rule 9,
 * ticket 213). Validation is pure and lives in `lib/`; callers run it first.
 */
export type TripPatch = Partial<{
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  colorKey: string | null;
}>;

export async function updateTrip(tripId: number, patch: TripPatch): Promise<void> {
  await db
    .update(trip)
    .set({ ...patch, ...touch() })
    .where(and(eq(trip.id, tripId), isNull(trip.deletedAt)));
}

/** Archiving is reversible and keeps every row — the delete below is the one-way door. */
export async function setTripArchived(
  tripId: number,
  archived: boolean,
): Promise<void> {
  await db
    .update(trip)
    .set({ archivedAt: archived ? new Date() : null, ...touch() })
    .where(eq(trip.id, tripId));
}

/** Soft-delete only — admin is the *only* role that can delete (ticket 01). */
export async function softDeleteTrip(tripId: number): Promise<void> {
  await db
    .update(trip)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(trip.id, tripId));
}
