/**
 * Friendship reconciliation (tickets 01/18).
 *
 * v1 has no cron (ticket 01 step 6: no automation anywhere), so the
 * "co-trip completes → friends" rule cannot fire on a timer. Instead it's
 * reconciled lazily every time the friends page loads: cheap (one user's
 * trips), idempotent (`onConflictDoNothing` against the canonical pair), and
 * good enough since nothing downstream depends on the exact moment it fires.
 */
import "server-only";

import { and, eq, inArray, isNull, lt, ne, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { friendship, trip, tripMembership, user, userProfile } from "@/db/schema";
import { today } from "@/lib/dates";
import { bounded, LIMITS } from "@/server/limits";

/**
 * Finds every other member of a trip the user was in whose end date has
 * passed, and inserts an "accepted"/"co_trip" friendship row for each pair
 * that isn't already friends (in either direction). Canonical direction is
 * lower userId first, matching the unique index on (user_id, friend_id) —
 * so we never race ourselves into a duplicate reversed row.
 */
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

  // Scoped to the trips in hand (ticket 114). This used to select **every
  // `trip_membership` row in the database** and filter by trip in JavaScript —
  // the one query here that degraded with total user count rather than with the
  // size of one trip, on every /friends load, over HTTP.
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

  // One insert, not one per person. Canonical direction is lower userId first,
  // matching the unique index, so we never race ourselves into a reversed row —
  // and `onConflictDoNothing` still makes the whole statement idempotent.
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

/**
 * The trips two people are both live members of, in one query (ticket 114).
 *
 * A self-join, where `sharesATrip` and `coTripNameFor` each did the same job in
 * two round trips and an intersection in JavaScript. Both callers are on the
 * public-profile path, which runs several of these.
 */
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

/**
 * Where you stand with someone, from your side (ticket 96) — what the "add as
 * friend" control on their profile and on a trip roster has to render.
 *
 * `friendship` is one row per requested direction, so "pending" means two
 * different things depending on which end you're at: a request you sent and a
 * request waiting on you are not the same button.
 */
export type FriendshipRow = {
  userId: string;
  friendId: string;
  status: string;
  origin: string;
};

/**
 * Every live friendship the viewer is either end of (ticket 118) — accepted,
 * requested, and requested-of, in one read. The page sorts them into its three
 * lists; which end of a row you're at is what tells incoming from outgoing.
 */
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

/**
 * Names and faces for a set of people (ticket 118).
 *
 * One query for the lot: this was a `personFor(id)` awaited per friendship row,
 * so a hundred friends was a hundred serial round trips before the page could
 * render a single face. Display name wins over the account name, and the
 * profile picture over the provider's, exactly as `personFor` had it.
 */
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

/**
 * The most-recently-ended trip shared with `otherId`, for the quiet
 * "met on <trip name>" line (ticket 18) — not a loud badge, just a hint that
 * distinguishes an auto-added friend from a manually-requested one.
 */
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
 * The `friendship` writes behind `app/friends/actions.ts` (ticket 108). The
 * rules they own, so the actions file states none of them twice:
 *
 * - **Soft-delete (rule 8)** on every match, so a cancelled request is never
 *   accepted and a removed friendship is never revived by accident.
 * - **The pair is unordered.** `friendship_pair_idx` stores one direction, so
 *   "are these two connected" always has to look both ways — `eitherWay` below
 *   is that, once.
 * - **Revalidation.** A friendship shows on `/friends` and on the other
 *   person's profile, always both.
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

export function revalidateFriendship(otherId: string): void {
  revalidatePath("/friends");
  revalidatePath(`/profile/${otherId}`);
}

/** The account behind an id, or undefined. Used to address the request email. */
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

/**
 * Opens (or re-opens) a pending request from `viewerId` to `targetId`.
 *
 * An upsert, not an insert: cancelling a request — or declining one, or
 * removing a friend — soft-deletes the row, but `friendship_pair_idx` is
 * unique on (user_id, friend_id) with no `deleted_at` in it, so a plain insert
 * of the same pair a second time hits a UNIQUE constraint and throws. The
 * soft-deleted row is the row we want back, so revive it in place.
 */
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
