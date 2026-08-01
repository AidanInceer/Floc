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

import { db } from "@/db";
import { friendship, trip, tripMembership } from "@/db/schema";
import { today } from "@/lib/dates";

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

  const coMembers = await db
    .select({ userId: tripMembership.userId, tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(
      and(
        isNull(tripMembership.deletedAt),
        ne(tripMembership.userId, userId),
      ),
    )
    .all();

  const tripIdSet = new Set(tripIds);
  const otherUserIds = new Set(
    coMembers.filter((m) => tripIdSet.has(m.tripId)).map((m) => m.userId),
  );

  for (const otherId of otherUserIds) {
    const [lo, hi] = userId < otherId ? [userId, otherId] : [otherId, userId];
    await db
      .insert(friendship)
      .values({
        userId: lo,
        friendId: hi,
        status: "accepted",
        origin: "co_trip",
      })
      .onConflictDoNothing();
  }
}

/**
 * Where you stand with someone, from your side (ticket 96) — what the "add as
 * friend" control on their profile and on a trip roster has to render.
 *
 * `friendship` is one row per requested direction, so "pending" means two
 * different things depending on which end you're at: a request you sent and a
 * request waiting on you are not the same button.
 */
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
  const mine = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt)))
    .all();
  const theirs = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(and(eq(tripMembership.userId, otherId), isNull(tripMembership.deletedAt)))
    .all();
  const mineSet = new Set(mine.map((m) => m.tripId));
  const sharedTripIds = theirs.map((t) => t.tripId).filter((id) => mineSet.has(id));
  if (sharedTripIds.length === 0) return null;

  const shared = await db
    .select({ name: trip.name, endDate: trip.endDate })
    .from(trip)
    .where(and(isNull(trip.deletedAt), inArray(trip.id, sharedTripIds)))
    .all();

  const ended = shared
    .filter((t) => t.endDate && t.endDate < today())
    .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""));

  return ended[0]?.name ?? shared[0]?.name ?? null;
}
