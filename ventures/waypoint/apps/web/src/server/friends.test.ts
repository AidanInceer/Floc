/**
 * The two friendship reads that changed shape in ticket 114, checked against a
 * seeded multi-trip database rather than by inspection — which is what that
 * ticket asks for, because the H3 fix moves a filter from JavaScript into the
 * `where` clause and the whole point is that the answer stays identical.
 *
 * `theirs` exists in the seed precisely so "every membership row in the
 * database" and "the membership rows of my trips" can give different answers.
 * The old code selected the former; if the new `inArray` were wrong in either
 * direction, the outsider would show up here or the member would not.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  countIncomingFriendRequests,
  friendOfFriend,
  sharedTripIds,
  syncCompletedCoTripFriendships,
} from "@/server/friends";
import { canSeeFriendsOf, requireProfileView } from "@/server/visibility";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

/** Both seeded trips are undated; a co-trip friendship needs an ended one. */
async function endTrip(tripId: number, endDate = "2020-01-01") {
  await db
    .update(schema.trip)
    .set({ startDate: "2019-12-25", endDate })
    .where(eq(schema.trip.id, tripId));
}

const friendships = () => db.select().from(schema.friendship).all();

describe("syncCompletedCoTripFriendships", () => {
  it("friends the people you actually travelled with, and nobody else", async () => {
    await endTrip(world.ours.id);
    await endTrip(world.theirs.id); // ended too, but not the admin's trip

    await syncCompletedCoTripFriendships(world.admin);

    const rows = await friendships();
    expect(rows).toHaveLength(1);
    expect(rows[0].origin).toBe("co_trip");
    expect(rows[0].status).toBe("accepted");
    // Canonical direction is lower userId first, matching the unique index.
    expect([rows[0].userId, rows[0].friendId].sort()).toEqual(
      [world.admin, world.member].sort(),
    );
    // The outsider is in the database, on an ended trip, and is not a friend.
    expect(
      rows.some((r) => r.userId === world.outsider || r.friendId === world.outsider),
    ).toBe(false);
  });

  it("does nothing while the trip is still to come", async () => {
    await endTrip(world.ours.id, "2999-01-01");
    await syncCompletedCoTripFriendships(world.admin);
    expect(await friendships()).toHaveLength(0);
  });

  it("does nothing for an undated trip — undated is not finished (rule 9)", async () => {
    await syncCompletedCoTripFriendships(world.admin);
    expect(await friendships()).toHaveLength(0);
  });

  it("is idempotent, and does not resurrect a friendship you removed", async () => {
    await endTrip(world.ours.id);
    await syncCompletedCoTripFriendships(world.admin);
    await syncCompletedCoTripFriendships(world.admin);
    expect(await friendships()).toHaveLength(1);

    // Soft-deleted rows still hold the unique pair, so the re-run must not
    // insert a second one — nor quietly undo the removal.
    await db
      .update(schema.friendship)
      .set({ deletedAt: new Date() })
      .where(eq(schema.friendship.status, "accepted"));

    await syncCompletedCoTripFriendships(world.admin);
    const rows = await friendships();
    expect(rows).toHaveLength(1);
    expect(rows[0].deletedAt).not.toBeNull();
  });

  it("ignores a trip you have left", async () => {
    await endTrip(world.ours.id);
    await db
      .update(schema.tripMembership)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(schema.tripMembership.tripId, world.ours.id),
          eq(schema.tripMembership.userId, world.admin),
        ),
      );

    await syncCompletedCoTripFriendships(world.admin);
    expect(await friendships()).toHaveLength(0);
  });
});

describe("sharedTripIds", () => {
  it("finds the trips two people are both on", async () => {
    expect(await sharedTripIds(world.admin, world.member)).toEqual([world.ours.id]);
  });

  it("is symmetric", async () => {
    expect(await sharedTripIds(world.member, world.admin)).toEqual([world.ours.id]);
  });

  it("returns nothing for two people on separate trips", async () => {
    expect(await sharedTripIds(world.admin, world.outsider)).toEqual([]);
  });

  it("stops counting a trip once one of them has left", async () => {
    await db
      .update(schema.tripMembership)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(schema.tripMembership.tripId, world.ours.id),
          eq(schema.tripMembership.userId, world.member),
        ),
      );

    expect(await sharedTripIds(world.admin, world.member)).toEqual([]);
  });
});

/**
 * Friends-of-friends discovery (ticket 145).
 *
 * The interesting party is `stranger`: friends with Ada, in none of Mo's rings,
 * and so someone whose profile Mo cannot open at all. Everything below is about
 * what Mo may nonetheless learn and do from Ada's page.
 */
describe("friends of friends", () => {
  /** Ada's friend, and nobody else's. */
  let stranger: string;

  async function befriend(
    a: string,
    b: string,
    status: "accepted" | "pending" = "accepted",
  ) {
    const [lo, hi] = a < b ? [a, b] : [b, a];
    await db
      .insert(schema.friendship)
      .values({ userId: lo, friendId: hi, status, origin: "request" })
      .onConflictDoUpdate({
        target: [schema.friendship.userId, schema.friendship.friendId],
        set: { status, deletedAt: null },
      });
  }

  beforeEach(async () => {
    stranger = "u-stranger";
    await db
      .insert(schema.user)
      .values({ id: stranger, name: "Sam", email: "sam@example.test" });
    await befriend(world.admin, stranger);
  });

  const listFor = async (viewerId: string) =>
    (await requireProfileView(world.admin, viewerId)).friends;

  it("keeps the list inside the ring the owner set", async () => {
    // Mo shares a trip with Ada but isn't a friend, and the column defaults one
    // ring tighter than the rest — so the list simply isn't there.
    expect(await listFor(world.member)).toBeNull();

    await befriend(world.admin, world.member);
    expect((await listFor(world.member))?.map((f) => f.name)).toEqual(["Sam"]);
  });

  it("widens to co-travellers when the owner says so", async () => {
    await db
      .insert(schema.userProfile)
      .values({ userId: world.admin, visibilityFriends: "trip_members" });

    expect((await listFor(world.member))?.map((f) => f.name)).toEqual(["Sam"]);
  });

  it("leaves out the viewer, and anyone who went private", async () => {
    await befriend(world.admin, world.member);

    // Mo is on Ada's list too, and shouldn't be offered themselves.
    expect((await listFor(world.member))?.map((f) => f.id)).toEqual([stranger]);

    await db
      .insert(schema.userProfile)
      .values({ userId: stranger, isPrivate: true });
    expect(await listFor(world.member)).toEqual([]);
  });

  it("carries where the viewer stands with each person", async () => {
    await befriend(world.admin, world.member);
    await befriend(world.member, stranger, "pending");

    const rows = await listFor(world.member);
    // Mo asked first, so this is Mo's own request still out — not an invitation
    // to ask again.
    expect(rows?.[0]?.state).toBe(
      world.member < stranger ? "outgoing" : "incoming",
    );
  });

  it("only reaches through a friendship both people accepted", async () => {
    await befriend(world.admin, world.member);
    expect(await friendOfFriend(world.member, world.admin, stranger)).toBe(true);

    // A request Ada never answered is not a link in the chain.
    await befriend(world.admin, stranger, "pending");
    expect(await friendOfFriend(world.member, world.admin, stranger)).toBe(false);
  });

  it("refuses a chain through someone the viewer isn't friends with", async () => {
    // Mo shares a trip with Ada, which is not the same thing.
    expect(await friendOfFriend(world.member, world.admin, stranger)).toBe(false);
  });

  it("shuts the whole list off when the owner's profile is private", async () => {
    await befriend(world.admin, world.member);
    await db
      .insert(schema.userProfile)
      .values({ userId: world.admin, isPrivate: true });

    expect(await canSeeFriendsOf(world.admin, world.member)).toBe(false);
    expect(await listFor(world.member)).toBeNull();
  });
});

describe("countIncomingFriendRequests", () => {
  it("counts requests waiting on you, not the ones you sent", async () => {
    await db.insert(schema.friendship).values([
      {
        userId: world.admin,
        friendId: world.member,
        status: "pending",
        origin: "request",
      },
      {
        userId: world.member,
        friendId: world.outsider,
        status: "pending",
        origin: "request",
      },
    ]);

    expect(await countIncomingFriendRequests(world.member)).toBe(1);
    expect(await countIncomingFriendRequests(world.admin)).toBe(0);
  });

  it("stops counting one that's been answered or withdrawn", async () => {
    await db.insert(schema.friendship).values({
      userId: world.admin,
      friendId: world.member,
      status: "accepted",
      origin: "request",
    });
    expect(await countIncomingFriendRequests(world.member)).toBe(0);
  });
});
