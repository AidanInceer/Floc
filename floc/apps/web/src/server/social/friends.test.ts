import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  acceptPendingRequest,
  countIncomingFriendRequests,
  declineFriendRequest,
  dropFriendship,
  friendOfFriend,
  friendStateWith,
  listFriendshipsFor,
  openPendingRequest,
  sharedTripIds,
  splitFriendships,
  syncCompletedCoTripFriendships,
} from "@/server/social/friends";
import { canSeeFriendsOf, requireProfileView } from "@/server/auth/visibility";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

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
    await endTrip(world.theirs.id);

    await syncCompletedCoTripFriendships(world.admin);

    const rows = await friendships();
    expect(rows).toHaveLength(1);
    expect(rows[0].origin).toBe("co_trip");
    expect(rows[0].status).toBe("accepted");
    expect([rows[0].userId, rows[0].friendId].sort()).toEqual(
      [world.admin, world.member].sort(),
    );
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

describe("one row per friendship", () => {
  const pair = () =>
    world.admin < world.member ? [world.admin, world.member] : [world.member, world.admin];

  it.each(["lowest first", "highest first"])(
    "keeps a removed friend removed when the row is stored %s (rule 8)",
    async (way) => {
      await endTrip(world.ours.id);
      const [lo, hi] = pair();
      const [userId, friendId] = way === "lowest first" ? [lo, hi] : [hi, lo];
      await db
        .insert(schema.friendship)
        .values({ userId, friendId, status: "accepted", origin: "request" });

      await dropFriendship(lo, hi);
      await syncCompletedCoTripFriendships(world.admin);

      const rows = await friendships();
      expect(rows).toHaveLength(1);
      expect(rows[0].deletedAt).not.toBeNull();
    },
  );

  it("keeps a declined request declined after a shared trip", async () => {
    await endTrip(world.ours.id);
    const [lo, hi] = pair();
    await openPendingRequest(hi, lo);

    await declineFriendRequest(lo, hi);
    await syncCompletedCoTripFriendships(world.admin);

    expect(await friendStateWith(lo, hi)).toBe("none");
    expect(await friendships()).toHaveLength(1);
  });

  it("gives a pending request and a shared trip one row and one state", async () => {
    await endTrip(world.ours.id);
    const [lo, hi] = pair();
    await openPendingRequest(hi, lo);

    await syncCompletedCoTripFriendships(world.admin);

    expect(await friendships()).toHaveLength(1);
    expect(await friendStateWith(hi, lo)).toBe("outgoing");
    expect(await friendStateWith(lo, hi)).toBe("incoming");
  });

  it("stores a request lowest id first and remembers who asked", async () => {
    const [lo, hi] = pair();

    await openPendingRequest(hi, lo);

    const [row] = await friendships();
    expect([row.userId, row.friendId, row.requestedBy]).toEqual([lo, hi, hi]);
    expect(await countIncomingFriendRequests(lo)).toBe(1);
    expect(await countIncomingFriendRequests(hi)).toBe(0);
  });

  it("lets only the person asked accept a request", async () => {
    const [lo, hi] = pair();
    await openPendingRequest(hi, lo);

    await acceptPendingRequest(lo, hi);
    expect(await friendStateWith(hi, lo)).toBe("outgoing");

    await acceptPendingRequest(hi, lo);
    expect(await friendStateWith(hi, lo)).toBe("friends");
  });

  it("reads a request stored without requested_by from its direction", async () => {
    const [lo, hi] = pair();
    await db
      .insert(schema.friendship)
      .values({ userId: hi, friendId: lo, status: "pending", origin: "request" });

    const asked = splitFriendships(await listFriendshipsFor(lo), lo);
    const asker = splitFriendships(await listFriendshipsFor(hi), hi);

    expect(asked.incoming).toHaveLength(1);
    expect(asker.outgoing).toHaveLength(1);
  });

  it("reopens the same row when someone asks again after a decline", async () => {
    const [lo, hi] = pair();
    await openPendingRequest(lo, hi);
    await declineFriendRequest(hi, lo);

    await openPendingRequest(hi, lo);

    const rows = await friendships();
    expect(rows).toHaveLength(1);
    expect(rows[0].deletedAt).toBeNull();
    expect(rows[0].requestedBy).toBe(hi);
  });

  it("refuses a second row for a pair in either direction", async () => {
    const [lo, hi] = pair();
    await db.insert(schema.friendship).values({ userId: lo, friendId: hi, status: "accepted" });

    await expect(
      db.insert(schema.friendship).values({ userId: hi, friendId: lo, status: "pending" }),
    ).rejects.toThrow();
  });

  it("refuses a friendship with yourself", async () => {
    await expect(
      db.insert(schema.friendship).values({ userId: world.admin, friendId: world.admin }),
    ).rejects.toThrow();
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

describe("friends of friends", () => {
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
    expect(rows?.[0]?.state).toBe(
      world.member < stranger ? "outgoing" : "incoming",
    );
  });

  it("only reaches through a friendship both people accepted", async () => {
    await befriend(world.admin, world.member);
    expect(await friendOfFriend(world.member, world.admin, stranger)).toBe(true);

    await befriend(world.admin, stranger, "pending");
    expect(await friendOfFriend(world.member, world.admin, stranger)).toBe(false);
  });

  it("refuses a chain through someone the viewer isn't friends with", async () => {
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

