/**
 * Who is actually on a trip (ticket 242, split out of the old membership file).
 * Every write to *the roster* goes through here, `invites.ts` included, so the
 * revive-on-rejoin rule has one home. Other people's facts also live on the
 * `trip_membership` row — packing's tier is packing's, and reads it from there.
 *
 * Leaving spans this table and the trip row and must not be split (ticket 108),
 * which is why `leaveTripAs` reaches into `trips.ts` to archive.
 */
import "server-only";

import { and, count, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";

import { db } from "@/db";
import { nudge, tripMembership } from "@/db/schema";
import type { NudgeTab } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { tripHref } from "@floc/core/notifications/notification-href";
import { touch } from "@/server/audit";
import { kickFromTripNotes } from "@/server/notes/live/live-kick";
import { recordActivity } from "@/server/notifications/activity";
import { setTripArchived } from "@/server/trips/trips";

/** Matches one live membership row. Every roster read and write goes through this. */
export function liveMembership(tripId: number, userId: string) {
  return and(
    eq(tripMembership.tripId, tripId),
    eq(tripMembership.userId, userId),
    isNull(tripMembership.deletedAt),
  );
}

/** Roster count — the one fact the invite teaser may show. */
export async function countMembers(tripId: number): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tripMembership)
    .where(
      and(eq(tripMembership.tripId, tripId), isNull(tripMembership.deletedAt)),
    );
  return row?.value ?? 0;
}

/** The teaser's "already in" check. */
export async function isLiveMember(tripId: number, userId: string): Promise<boolean> {
  const row = await db
    .select({ userId: tripMembership.userId })
    .from(tripMembership)
    .where(liveMembership(tripId, userId))
    .get();
  return !!row;
}

/**
 * Must revive a soft-deleted row rather than no-op, or a kick would permanently
 * bar a re-invited member — the one write that deliberately reaches past
 * `deletedAt`. Both doors into a trip land here; `invites.ts` owns which door.
 */
export async function addMember(tripId: number, userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(tripMembership)
      .values({ tripId, userId, role: "member" })
      .onConflictDoUpdate({
        target: [tripMembership.tripId, tripMembership.userId],
        // mapPromptAt clears: rejoining moots the "keep these countries?" question (ticket 95)
        set: { deletedAt: null, mapPromptAt: null, lastModifiedAt: new Date() },
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

/** `mapPromptAt` parks the "keep these countries?" question for later (ticket 95) — leaving and being kicked leave the same mark since only they can answer it. */
export async function removeMembership(
  tripId: number,
  userId: string,
  by: string,
): Promise<void> {
  const removed = await db.transaction(async (tx) => {
    const gone = await tx
      .update(tripMembership)
      .set({ deletedAt: new Date(), mapPromptAt: new Date(), ...touch() })
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
  });
  if (removed) kickFromTripNotes(tripId, userId);
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

/**
 * Leaving (ticket 65) — succession and archiving applied together so they can't come apart.
 * Last admin leaving with others remaining: admin passes to earliest-joined (succession, not
 * a fifth power — rule 6). Last member out archives, never deletes, the trip.
 */
export async function leaveTripAs(args: {
  tripId: number;
  userId: string;
  isAdmin: boolean;
  archivedAt: Date | null;
  others: { userId: string; role: string; joinedAt: Date }[];
}): Promise<void> {
  const { tripId, userId, isAdmin, archivedAt, others } = args;

  await removeMembership(tripId, userId, userId);

  if (others.length === 0) {
    if (!archivedAt) await setTripArchived(tripId, true);
    return;
  }

  if (isAdmin && !others.some((m) => m.role === "admin")) {
    const heir = others.reduce((earliest, m) =>
      m.joinedAt < earliest.joinedAt ? m : earliest,
    );
    await setMemberRoleAdmin(tripId, heir.userId);
  }
}

/**
 * Roster half of account deletion (ticket 06) — same succession rule as `leaveTripAs`,
 * but walks every trip at once and does not archive an emptied one (other rows stay
 * attributed to a placeholder; archiving on the account's behalf is nobody's decision).
 * A trip left with no admin is an accepted v1 edge case.
 */
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
    // One read for every trip administered, not a query+write per trip (ticket 114).
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

      const heir = roster.reduce((earliest, m) =>
        m.createdAt < earliest.createdAt ? m : earliest,
      );
      promotions.push(setMemberRoleAdmin(tripId, heir.userId));
    }
    await Promise.all(promotions); // distinct trips, cannot race each other
  }

  // No mapPromptAt here unlike removeMembership: there's no later to answer it in —
  // the account and its profile are both going in this same request (ticket 114).
  await db
    .update(tripMembership)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(eq(tripMembership.userId, userId));
  kickFromTripNotes(null, userId);
}

/* --------------------------------------------------------- the map prompt */

/** Whether this trip has left its "keep these countries?" question unanswered. */
export async function hasPendingMapPrompt(
  tripId: number,
  userId: string,
): Promise<boolean> {
  const row = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, userId),
        isNotNull(tripMembership.mapPromptAt),
      ),
    )
    .get();
  return row !== undefined;
}

/** Deliberately not filtered on `deletedAt` — the target row belongs to someone who's already left. */
export async function clearMapPrompt(
  tripId: number,
  userId: string,
): Promise<void> {
  await db
    .update(tripMembership)
    .set({ mapPromptAt: null, lastModifiedAt: new Date() })
    .where(
      and(eq(tripMembership.tripId, tripId), eq(tripMembership.userId, userId)),
    );
}

/* -------------------------------------------------------------- the nudge */

/** A poke aimed at one member of the roster. It reaches them through the inbox, like every other change (#344). */
export async function insertNudge(args: {
  tripId: number;
  fromUserId: string;
  toUserId: string;
  tab: NudgeTab;
  message: string | null;
}): Promise<void> {
  await db.transaction(async (tx) => {
    const row = await tx.insert(nudge).values(args).returning({ id: nudge.id }).get();
    await recordActivity(tx, {
      kind: "nudge_sent",
      tripId: args.tripId,
      actorId: args.fromUserId,
      subjectId: row.id,
      href: tripHref(args.tripId, args.tab),
      affected: [args.toUserId],
    });
  });
}
