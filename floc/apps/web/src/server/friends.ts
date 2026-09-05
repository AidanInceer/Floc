/**
 * Friendship reconciliation (tickets 01/18). No cron in v1, so "co-trip
 * completes → friends" is reconciled lazily on friends-page load: cheap,
 * idempotent (`onConflictDoNothing`), exact timing doesn't matter.
 */
import "server-only";

import { and, count, eq, inArray, isNull, lt, ne, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { friendship, trip, tripMembership, user, userProfile } from "@/db/schema";
import { today } from "@floc/core/dates";
import { bounded, LIMITS } from "@/server/limits";

/** Canonical direction is lower userId first, matching the unique index — never a duplicate reversed row. */
export async function syncCompletedCoTripFriendships(userId: string): Promise<void> {
  const completedTrips = await db
    .select({ tripId: trip.id })
    .from(trip)
    .innerJoin(tripMembership, eq(tripMembership.tripId, trip.id))
    .where(
      and(
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
        isNull(trip.deletedAt),
        lt(trip.endDate, today()),
      ),
    )
    .all();

  if (completedTrips.length === 0) return;

  const tripIds = completedTrips.map((t) => t.tripId);

  // Scoped to the trips in hand — used to select every trip_membership row and
  // filter in JS, degrading with total user count on every /friends load (ticket 114).
  const coMembers = await db
    .select({ userId: tripMembership.userId })
    .from(tripMembership)
    .where(
      and(
        inArray(tripMembership.tripId, tripIds),
        isNull(tripMembership.deletedAt),
        ne(tripMembership.userId, userId),
      ),
    )
    .limit(LIMITS.members * tripIds.length)
    .all();

  const otherUserIds = new Set(
    bounded(coMembers, "members", `co-members of ${userId}'s past trips`).map(
      (m) => m.userId,
    ),
  );
  if (otherUserIds.size === 0) return;

  // One insert, not one per person; onConflictDoNothing keeps it idempotent.
  await db
    .insert(friendship)
    .values(
      [...otherUserIds].map((otherId) => {
        const [lo, hi] = userId < otherId ? [userId, otherId] : [otherId, userId];
        return {
          userId: lo,
          friendId: hi,
          status: "accepted" as const,
          origin: "co_trip" as const,
        };
      }),
    )
    .onConflictDoNothing();
}

/** Self-join, one query — replaced two round trips + a JS intersection (ticket 114). */
export async function sharedTripIds(a: string, b: string): Promise<number[]> {
  const mine = alias(tripMembership, "mine");
  const theirs = alias(tripMembership, "theirs");

  const rows = await db
    .select({ tripId: mine.tripId })
    .from(mine)
    .innerJoin(theirs, eq(theirs.tripId, mine.tripId))
    .where(
      and(
        eq(mine.userId, a),
        eq(theirs.userId, b),
        isNull(mine.deletedAt),
        isNull(theirs.deletedAt),
      ),
    )
    .limit(LIMITS.tripsPerUser)
    .all();

  return bounded(rows, "tripsPerUser", `${a} ∩ ${b}`).map((r) => r.tripId);
}

/** One row per requested direction, so "pending" means different things per end — a sent request and one waiting on you are not the same button (ticket 96). */
export type FriendshipRow = {
  userId: string;
  friendId: string;
  status: string;
  origin: string;
};

/** Every live friendship the viewer is either end of, one read — which end you're at tells incoming from outgoing (ticket 118). */
export async function listFriendshipsFor(
  viewerId: string,
): Promise<FriendshipRow[]> {
  const rows = await db
    .select({
      userId: friendship.userId,
      friendId: friendship.friendId,
      status: friendship.status,
      origin: friendship.origin,
    })
    .from(friendship)
    .where(
      and(
        isNull(friendship.deletedAt),
        or(eq(friendship.userId, viewerId), eq(friendship.friendId, viewerId)),
      ),
    )
    .limit(LIMITS.members * LIMITS.tripsPerUser)
    .all();
  return rows;
}

export type Person = { id: string; name: string; avatarUrl: string | null };

/** One query for the lot — was a `personFor(id)` per row, a hundred friends meant a hundred round trips (ticket 118). */
export async function peopleByIds(ids: string[]): Promise<Map<string, Person>> {
  const out = new Map<string, Person>();
  if (ids.length === 0) return out;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      displayName: userProfile.displayName,
      avatarUrl: userProfile.avatarUrl,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(inArray(user.id, [...new Set(ids)]))
    .limit(LIMITS.members * LIMITS.tripsPerUser)
    .all();

  for (const r of rows) {
    out.set(r.id, {
      id: r.id,
      name: r.displayName ?? r.name ?? "Someone",
      avatarUrl: r.avatarUrl ?? r.image ?? null,
    });
  }
  return out;
}

/** Accepted only — offering someone who hasn't agreed to know you would make a trip invite a backdoor friend request (ticket 146). */
export async function listFriendsFor(viewerId: string): Promise<Person[]> {
  const rows = await listFriendshipsFor(viewerId);
  const accepted = rows.filter((r) => r.status === "accepted");
  const otherIds = accepted.map((r) =>
    r.userId === viewerId ? r.friendId : r.userId,
  );

  const people = await peopleByIds(otherIds);
  return [...people.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" }),
  );
}

/** Ids only, no visibility judgement — that's `server/visibility.ts`'s call; mixing them grows a second, quieter permission model (ticket 145). */
export async function acceptedFriendIdsOf(ownerId: string): Promise<string[]> {
  const rows = await listFriendshipsFor(ownerId);
  return rows
    .filter((r) => r.status === "accepted")
    .map((r) => (r.userId === ownerId ? r.friendId : r.userId));
}

/**
 * Friend-of-a-friend chain, re-derived (ticket 145): viewer and target both
 * friends of `viaId`. Whether the viewer was allowed to see that list is a
 * separate visibility check, not this function's job.
 */
export async function friendOfFriend(
  viewerId: string,
  viaId: string,
  targetId: string,
): Promise<boolean> {
  if (viaId === viewerId || viaId === targetId) return false;

  const [toVia, viaToTarget] = await Promise.all([
    friendshipBetween(viewerId, viaId),
    friendshipBetween(viaId, targetId),
  ]);

  return toVia?.status === "accepted" && viaToTarget?.status === "accepted";
}

/** Badges the chrome's Friends link, so a request is visible on next load, not just in an email (ticket 145). */
export async function countIncomingFriendRequests(
  viewerId: string,
): Promise<number> {
  const row = await db
    .select({ n: count() })
    .from(friendship)
    .where(
      and(
        isNull(friendship.deletedAt),
        eq(friendship.status, "pending"),
        eq(friendship.friendId, viewerId),
      ),
    )
    .get();
  return row?.n ?? 0;
}

export type FriendState = "none" | "friends" | "outgoing" | "incoming";

/** Several people at once — a trip roster asks about every member. */
export async function friendStatesFor(
  viewerId: string,
  otherIds: string[],
): Promise<Map<string, FriendState>> {
  const states = new Map<string, FriendState>(
    otherIds.map((id) => [id, "none" as FriendState]),
  );
  if (otherIds.length === 0) return states;

  const rows = await db
    .select({
      userId: friendship.userId,
      friendId: friendship.friendId,
      status: friendship.status,
    })
    .from(friendship)
    .where(
      and(
        isNull(friendship.deletedAt),
        or(eq(friendship.userId, viewerId), eq(friendship.friendId, viewerId)),
      ),
    )
    .all();

  for (const r of rows) {
    const otherId = r.userId === viewerId ? r.friendId : r.userId;
    if (!states.has(otherId)) continue;
    states.set(
      otherId,
      r.status === "accepted"
        ? "friends"
        : r.userId === viewerId
          ? "outgoing"
          : "incoming",
    );
  }

  return states;
}

export async function friendStateWith(
  viewerId: string,
  otherId: string,
): Promise<FriendState> {
  const states = await friendStatesFor(viewerId, [otherId]);
  return states.get(otherId) ?? "none";
}

/** For the quiet "met on <trip name>" line, distinguishing an auto-added friend from a requested one (ticket 18). */
export async function coTripNameFor(
  userId: string,
  otherId: string,
): Promise<string | null> {
  const ids = await sharedTripIds(userId, otherId);
  if (ids.length === 0) return null;

  const shared = await db
    .select({ name: trip.name, endDate: trip.endDate })
    .from(trip)
    .where(and(isNull(trip.deletedAt), inArray(trip.id, ids)))
    .limit(LIMITS.tripsPerUser)
    .all();

  const ended = shared
    .filter((t) => t.endDate && t.endDate < today())
    .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""));

  return ended[0]?.name ?? shared[0]?.name ?? null;
}

/* ------------------------------------------------- the request lifecycle */
/*
 * `friendship` writes behind `app/friends/actions.ts` (ticket 108). Rules
 * owned here: soft-delete on every match; pair is unordered (`eitherWay`
 * covers both directions since the index stores one).
 */

/** Both directions of a pair, live rows only. */
function eitherWay(a: string, b: string) {
  return and(
    isNull(friendship.deletedAt),
    or(
      and(eq(friendship.userId, a), eq(friendship.friendId, b)),
      and(eq(friendship.userId, b), eq(friendship.friendId, a)),
    ),
  );
}

/** Used to address the request email. */
export async function findUserById(userId: string) {
  return db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .get();
}

/** Any live friendship between two people, in either direction. */
export async function friendshipBetween(a: string, b: string) {
  return db.select().from(friendship).where(eitherWay(a, b)).get();
}

/** Upsert not insert — `friendship_pair_idx` ignores `deletedAt`, so a plain insert of a soft-deleted pair hits the UNIQUE constraint; revive in place instead. */
export async function openPendingRequest(
  viewerId: string,
  targetId: string,
): Promise<void> {
  await db
    .insert(friendship)
    .values({
      userId: viewerId,
      friendId: targetId,
      status: "pending",
      origin: "request",
    })
    .onConflictDoUpdate({
      target: [friendship.userId, friendship.friendId],
      set: {
        status: "pending",
        origin: "request",
        deletedAt: null,
        lastModifiedAt: new Date(),
      },
    });
}

/** Matches the one pending row `requesterId` opened towards `addresseeId`. */
function pendingRequest(requesterId: string, addresseeId: string) {
  return and(
    eq(friendship.userId, requesterId),
    eq(friendship.friendId, addresseeId),
    eq(friendship.status, "pending"),
    isNull(friendship.deletedAt),
  );
}

export async function acceptPendingRequest(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  await db
    .update(friendship)
    .set({ status: "accepted", lastModifiedAt: new Date() })
    .where(pendingRequest(requesterId, addresseeId));
}

/** Declining and cancelling are the same write from the two opposite ends. */
export async function dropPendingRequest(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  await db
    .update(friendship)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(pendingRequest(requesterId, addresseeId));
}

/** Soft-deletes either direction of an accepted friendship. */
export async function dropFriendship(a: string, b: string): Promise<void> {
  await db
    .update(friendship)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(and(eq(friendship.status, "accepted"), eitherWay(a, b)));
}
