import "server-only";

import { and, count, eq, inArray, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripMembership } from "@/db/schema";
import { assertRoom, bounded, LIMITS } from "@/server/limits";
import { tripHref } from "@floc/core/notifications/notification-href";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { kickFromTripNotes } from "@/server/notes/live/live-kick";
import { recordActivity, type Tx } from "@/server/notifications/activity";
import { countMembershipsOf } from "@/server/trips/trips";
import { isLiveMember } from "@/server/trips/live-member";

export function liveMembership(tripId: number, userId: string) {
  return and(
    eq(tripMembership.tripId, tripId),
    eq(tripMembership.userId, userId),
    isNull(tripMembership.deletedAt),
  );
}

export async function countMembers(tripId: number): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tripMembership)
    .where(
      and(eq(tripMembership.tripId, tripId), isNull(tripMembership.deletedAt)),
    );
  return row?.value ?? 0;
}

export async function addMember(tripId: number, userId: string): Promise<void> {
  if (!(await isLiveMember(tripId, userId))) assertRoom("tripsPerUser", await countMembershipsOf(db, userId));
  await db.transaction(async (tx) => {
    await tx
      .insert(tripMembership)
      .values({ tripId, userId, role: "member" })
      .onConflictDoUpdate({
        target: [tripMembership.tripId, tripMembership.userId],
        set: {
          role: sql`CASE WHEN ${tripMembership.deletedAt} IS NULL THEN ${tripMembership.role} ELSE 'member' END`,
          deletedAt: null,
          lastModifiedAt: new Date(),
        },
      });
    await recordActivity(tx, {
      kind: "member_joined",
      tripId,
      actorId: userId,
      subjectId: null,
      href: tripHref(tripId, "overview"),
      affected: [],
    });
  });
}

async function markRemoved(tx: Tx, tripId: number, userId: string, by: string): Promise<boolean> {
  const gone = await tx
    .update(tripMembership)
    .set({ deletedAt: new Date(), ...touch() })
    .where(liveMembership(tripId, userId))
    .returning({ userId: tripMembership.userId })
    .all();
  if (gone.length === 0) return false;
  await recordActivity(tx, {
    kind: "member_left",
    tripId,
    actorId: by,
    subjectId: null,
    href: tripHref(tripId, "overview"),
    affected: [],
  });
  return true;
}

export async function removeMembership(
  tripId: number,
  userId: string,
  by: string,
): Promise<void> {
  const removed = await db.transaction((tx) => markRemoved(tx, tripId, userId, by));
  if (removed) kickFromTripNotes(tripId, userId);
  refresh({ kind: "tripOverview", tripId }, { kind: "tripHeader", tripId }, { kind: "profileTrips" });
}

export async function setMemberRoleAdmin(
  tripId: number,
  userId: string,
): Promise<void> {
  await db
    .update(tripMembership)
    .set({ role: "admin", ...touch() })
    .where(liveMembership(tripId, userId));
}

export async function promoteToAdmin(tripId: number, userId: string): Promise<void> {
  await setMemberRoleAdmin(tripId, userId);
  refresh({ kind: "tripOverview", tripId }, { kind: "tripHeader", tripId });
}

export async function leaveTripAs(args: {
  tripId: number;
  userId: string;
  isAdmin: boolean;
  archivedAt: Date | null;
  others: { userId: string; role: string; joinedAt: Date }[];
}): Promise<void> {
  const { tripId, userId, isAdmin, archivedAt, others } = args;

  const left = await db.transaction(async (tx) => {
    if (!(await markRemoved(tx, tripId, userId, userId))) return false;

    if (others.length === 0) {
      if (!archivedAt) {
        await tx
          .update(trip)
          .set({ archivedAt: new Date(), ...touch() })
          .where(and(eq(trip.id, tripId), isNull(trip.deletedAt)));
      }
    } else if (isAdmin && !others.some((m) => m.role === "admin")) {
      const heir = others.reduce(
        (earliest, m) => (m.joinedAt < earliest.joinedAt ? m : earliest),
        others[0],
      );
      await tx
        .update(tripMembership)
        .set({ role: "admin", ...touch() })
        .where(liveMembership(tripId, heir.userId));
    }
    return true;
  });
  if (left) kickFromTripNotes(tripId, userId);
  refresh({ kind: "tripList" }, { kind: "profileTrips" });
}

export async function handOverAndLeaveAllTrips(userId: string): Promise<void> {
  const mine = await db
    .select({ tripId: tripMembership.tripId, role: tripMembership.role })
    .from(tripMembership)
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt)))
    .limit(LIMITS.tripsPerUser)
    .all();

  const adminTripIds = bounded(mine, "tripsPerUser", "user's trips")
    .filter((m) => m.role === "admin")
    .map((m) => m.tripId);

  if (adminTripIds.length > 0) {
    const others = await db
      .select({
        tripId: tripMembership.tripId,
        userId: tripMembership.userId,
        role: tripMembership.role,
        createdAt: tripMembership.createdAt,
      })
      .from(tripMembership)
      .where(
        and(
          inArray(tripMembership.tripId, adminTripIds),
          ne(tripMembership.userId, userId),
          isNull(tripMembership.deletedAt),
        ),
      )
      .limit(LIMITS.members * adminTripIds.length)
      .all();

    const byTrip = new Map<number, typeof others>();
    for (const row of bounded(others, "members", "trips being handed over")) {
      byTrip.set(row.tripId, [...(byTrip.get(row.tripId) ?? []), row]);
    }

    const promotions: Promise<unknown>[] = [];
    for (const tripId of adminTripIds) {
      const roster = byTrip.get(tripId) ?? [];
      if (roster.length === 0 || roster.some((m) => m.role === "admin")) continue;

      const heir = roster.reduce(
        (earliest, m) => (m.createdAt < earliest.createdAt ? m : earliest),
        roster[0],
      );
      promotions.push(setMemberRoleAdmin(tripId, heir.userId));
    }
    await Promise.all(promotions);
  }

  await db
    .update(tripMembership)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(eq(tripMembership.userId, userId));
  kickFromTripNotes(null, userId);
}
