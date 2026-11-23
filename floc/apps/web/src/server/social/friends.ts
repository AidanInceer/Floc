import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import "server-only";

import { and, count, eq, inArray, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import {
  friendship,
  trip,
  tripMembership,
  user,
  userProfile,
  type FriendshipOrigin,
} from "@/db/schema";
import { today } from "@floc/core/dates/dates";
import { refresh } from "@/server/freshness";
import { bounded, LIMITS } from "@/server/limits";
import { recordActivity } from "@/server/notifications/activity";

export async function syncCompletedCoTripFriendships(userId: string): Promise<void> {
  const mine = alias(tripMembership, "mine");
  const coMembers = await db
    .selectDistinct({ userId: tripMembership.userId })
    .from(mine)
    .innerJoin(trip, eq(trip.id, mine.tripId))
    .innerJoin(tripMembership, eq(tripMembership.tripId, mine.tripId))
    .where(
      and(
        eq(mine.userId, userId),
        isNull(mine.deletedAt),
        isNull(trip.deletedAt),
        lt(trip.endDate, today()),
        isNull(tripMembership.deletedAt),
        ne(tripMembership.userId, userId),
      ),
    )
    .limit(LIMITS.members * LIMITS.tripsPerUser)
    .all();

  const otherUserIds = new Set(
    bounded(coMembers, "members", `co-members of ${userId}'s past trips`).map(
      (m) => m.userId,
    ),
  );
  if (otherUserIds.size === 0) return;

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

export type FriendshipRow = {
  userId: string;
  friendId: string;
  status: string;
  origin: string;
  requestedBy: string | null;
};

const requesterOf = (row: { userId: string; requestedBy: string | null }) =>
  row.requestedBy ?? row.userId;

const requesterColumn = sql<string>`coalesce(${friendship.requestedBy}, ${friendship.userId})`;

export async function listFriendshipsFor(
  viewerId: string,
): Promise<FriendshipRow[]> {
  const rows = await db
    .select({
      userId: friendship.userId,
      friendId: friendship.friendId,
      status: friendship.status,
      origin: friendship.origin,
      requestedBy: friendship.requestedBy,
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

export function splitFriendships(rows: FriendshipRow[], viewerId: string) {
  return {
    accepted: rows.filter((r) => r.status === "accepted"),
    incoming: rows.filter((r) => r.status === "pending" && requesterOf(r) !== viewerId),
    outgoing: rows.filter((r) => r.status === "pending" && requesterOf(r) === viewerId),
  };
}

export type Person = { id: string; name: string; avatarIcon: AvatarIcon | null };

export async function peopleByIds(ids: string[]): Promise<Map<string, Person>> {
  const out = new Map<string, Person>();
  if (ids.length === 0) return out;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      displayName: userProfile.displayName,
      avatarIcon: userProfile.avatarIcon,
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
      avatarIcon: r.avatarIcon,
    });
  }
  return out;
}

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

export async function acceptedFriendIdsOf(ownerId: string): Promise<string[]> {
  const rows = await listFriendshipsFor(ownerId);
  return rows
    .filter((r) => r.status === "accepted")
    .map((r) => (r.userId === ownerId ? r.friendId : r.userId));
}

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
        or(eq(friendship.userId, viewerId), eq(friendship.friendId, viewerId)),
        ne(requesterColumn, viewerId),
      ),
    )
    .get();
  return row?.n ?? 0;
}

export type FriendState = "none" | "friends" | "outgoing" | "incoming";

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
      requestedBy: friendship.requestedBy,
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
        : requesterOf(r) === viewerId
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

function samePair(a: string, b: string) {
  return or(
    and(eq(friendship.userId, a), eq(friendship.friendId, b)),
    and(eq(friendship.userId, b), eq(friendship.friendId, a)),
  );
}

function eitherWay(a: string, b: string) {
  return and(isNull(friendship.deletedAt), samePair(a, b));
}

export async function findUserById(userId: string) {
  return db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .get();
}

export async function friendshipBetween(a: string, b: string) {
  return db.select().from(friendship).where(eitherWay(a, b)).get();
}

export async function openPendingRequest(
  viewerId: string,
  targetId: string,
  origin: FriendshipOrigin = "request",
): Promise<void> {
  const [lo, hi] = viewerId < targetId ? [viewerId, targetId] : [targetId, viewerId];
  await db.transaction(async (tx) => {
    await tx
      .insert(friendship)
      .values({ userId: lo, friendId: hi, status: "pending", origin, requestedBy: viewerId })
      .onConflictDoNothing();
    await tx
      .update(friendship)
      .set({
        status: "pending",
        origin,
        requestedBy: viewerId,
        deletedAt: null,
        lastModifiedAt: new Date(),
      })
      .where(and(samePair(viewerId, targetId), isNotNull(friendship.deletedAt)));
    await recordActivity(tx, {
      kind: "friend_requested",
      tripId: null,
      actorId: viewerId,
      subjectId: null,
      href: "/friends",
      affected: [targetId],
    });
  });
}

function pendingRequest(requesterId: string, addresseeId: string) {
  return and(
    samePair(requesterId, addresseeId),
    eq(requesterColumn, requesterId),
    eq(friendship.status, "pending"),
    isNull(friendship.deletedAt),
  );
}

export async function acceptPendingRequest(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const accepted = await tx
      .update(friendship)
      .set({ status: "accepted", lastModifiedAt: new Date() })
      .where(pendingRequest(requesterId, addresseeId))
      .returning({ id: friendship.id })
      .all();
    if (accepted.length === 0) return;
    await recordActivity(tx, {
      kind: "friend_accepted",
      tripId: null,
      actorId: addresseeId,
      subjectId: null,
      href: "/friends",
      affected: [requesterId],
    });
  });
  refresh({ kind: "friendship", otherId: requesterId });
}

async function dropPendingRequest(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  await db
    .update(friendship)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(pendingRequest(requesterId, addresseeId));
}

export async function declineFriendRequest(viewerId: string, requesterId: string): Promise<void> {
  await dropPendingRequest(requesterId, viewerId);
  refresh({ kind: "friendship", otherId: requesterId });
}

export async function cancelFriendRequest(viewerId: string, targetId: string): Promise<void> {
  await dropPendingRequest(viewerId, targetId);
  refresh({ kind: "friendship", otherId: targetId });
}

export async function dropFriendship(a: string, b: string): Promise<void> {
  await db
    .update(friendship)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(and(eq(friendship.status, "accepted"), eitherWay(a, b)));
  refresh({ kind: "friendship", otherId: b });
}
