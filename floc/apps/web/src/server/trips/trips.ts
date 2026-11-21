import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import { windowProblem } from "@floc/core/trip/trip-window";

import { and, count, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripMembership } from "@/db/schema";
import type { TripRole } from "@/db/schema";
import { assertRoom, bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";
import { removeGuestsOn } from "@/server/guests/guests";
import { kickFromTripNotes } from "@/server/notes/live/live-kick";
import { insertFirstPage } from "@/server/notes/pages/page-first";
import type { Tx } from "@/server/notifications/activity";
import type { PageBlock } from "@floc/core/notes/pages/page-blocks";

export type TripListRow = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  colorKey: string | null;
  mark: string | null;
  role: TripRole;
  starred: boolean;
  muted: boolean;
};

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
      mark: trip.mark,
      role: tripMembership.role,
      starredAt: tripMembership.starredAt,
      mutedAt: tripMembership.mutedAt,
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
  return bounded(rows, "tripsPerUser", `user ${userId}`).map(({ starredAt, mutedAt, ...row }) => ({
    ...row,
    starred: starredAt !== null,
    muted: mutedAt !== null,
  }));
}

export async function setTripMuted(tripId: number, userId: string, muted: boolean) {
  await db
    .update(tripMembership)
    .set({ mutedAt: muted ? new Date() : null, ...touch() })
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
      ),
    );
}

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

export type NewTripRow = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  firstPage?: PageBlock[];
};

export async function insertTripWithAdmin(tx: Tx, input: NewTripRow, held?: number): Promise<number> {
  const problem = input.startDate && input.endDate ? windowProblem(input.startDate, input.endDate) : null;
  if (problem) throw new Refusal(problem);
  assertRoom("tripsPerUser", held ?? (await countMembershipsOf(tx, input.createdBy)));
  const [created] = await tx
    .insert(trip)
    .values({
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      createdBy: input.createdBy,
      inviteToken: crypto.randomUUID(),
    })
    .returning({ id: trip.id });

  await tx.insert(tripMembership).values({
    tripId: created.id,
    userId: input.createdBy,
    role: "admin",
  });
  await insertFirstPage(tx, created.id, input.createdBy, input.firstPage);
  return created.id;
}

export async function countMembershipsOf(q: Pick<Tx, "select">, userId: string): Promise<number> {
  const [{ n }] = await q
    .select({ n: count() })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt), isNull(trip.deletedAt)));
  return n;
}

export async function createTripWithAdmin(input: NewTripRow, held?: number): Promise<number> {
  return db.transaction((tx) => insertTripWithAdmin(tx, input, held));
}

export async function tripsHeldBy(userId: string): Promise<number> {
  return countMembershipsOf(db, userId);
}

export type TripPatch = Partial<{
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  colorKey: string | null;
  mark: string | null;
}>;

export async function updateTrip(tripId: number, patch: TripPatch): Promise<void> {
  await db
    .update(trip)
    .set({ ...patch, ...touch() })
    .where(and(eq(trip.id, tripId), isNull(trip.deletedAt)));
}

export async function resetInviteToken(tripId: number): Promise<string> {
  const minted = crypto.randomUUID();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(trip)
      .set({ inviteToken: minted, ...touch() })
      .where(and(eq(trip.id, tripId), isNull(trip.deletedAt)))
      .returning({ inviteToken: trip.inviteToken });
    if (row) await removeGuestsOn(tx, tripId);
    return row?.inviteToken ?? minted;
  });
}

export async function setTripArchived(
  tripId: number,
  archived: boolean,
): Promise<void> {
  await db
    .update(trip)
    .set({ archivedAt: archived ? new Date() : null, ...touch() })
    .where(and(eq(trip.id, tripId), isNull(trip.deletedAt)));
}

export async function softDeleteTrip(tripId: number): Promise<void> {
  await db
    .update(trip)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(trip.id, tripId));
  kickFromTripNotes(tripId);
}
