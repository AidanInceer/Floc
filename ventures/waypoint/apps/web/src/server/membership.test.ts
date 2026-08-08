/**
 * The membership aggregate's rules (ticket 108).
 *
 * These test the aggregate directly rather than through an action, because the
 * rules they check are the module's and not any one tab's: succession, the
 * revive-on-rejoin, and the soft-delete filter that keeps a departed member's
 * dead row out of every other write. Each one is a property the module exists
 * to hold, so each fails if the rule is moved back into a caller.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  clearAvailabilityFor,
  clearMapPrompt,
  countMembers,
  countPendingInvitesFor,
  createTripWithAdmin,
  findPendingInvite,
  findTripByInviteToken,
  inviteToTrip,
  listPendingInvitees,
  listPendingInvitesFor,
  settleInvite,
  handOverAndLeaveAllTrips,
  hasPendingMapPrompt,
  joinByToken,
  leaveTripAs,
  removeMembership,
  renameTrip,
  setAvailability,
  setMemberRoleAdmin,
  setTripArchived,
  setTripDateRange,
  setTripTagRows,
  softDeleteTrip,
} from "@/server/membership";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const membership = (tripId: number, userId: string) =>
  db
    .select()
    .from(schema.tripMembership)
    .where(
      and(
        eq(schema.tripMembership.tripId, tripId),
        eq(schema.tripMembership.userId, userId),
      ),
    )
    .get();

const tripRow = (id: number) =>
  db.select().from(schema.trip).where(eq(schema.trip.id, id)).get();

describe("creating a trip", () => {
  it("makes the creator an admin and mints an unguessable token", async () => {
    const id = await createTripWithAdmin({
      name: "Faroes",
      startDate: null,
      endDate: null,
      createdBy: world.admin,
    });

    const row = await tripRow(id);
    expect(row?.name).toBe("Faroes");
    // A random UUID, never derived from the trip id (ticket 05).
    expect(row?.inviteToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect((await membership(id, world.admin))?.role).toBe("admin");
  });

  it("starts undated, which is the normal path (rule 9)", async () => {
    const id = await createTripWithAdmin({
      name: "Somewhere",
      startDate: null,
      endDate: null,
      createdBy: world.admin,
    });
    const row = await tripRow(id);
    expect(row?.startDate).toBeNull();
    expect(row?.endDate).toBeNull();
  });
});

describe("the trip row", () => {
  it("renames, re-dates, clears back to undated, archives and un-archives", async () => {
    await renameTrip(world.ours.id, "Portugal, late summer");
    expect((await tripRow(world.ours.id))?.name).toBe("Portugal, late summer");

    await setTripDateRange(world.ours.id, "2026-09-01", "2026-09-08");
    expect((await tripRow(world.ours.id))?.endDate).toBe("2026-09-08");

    await setTripDateRange(world.ours.id, null, null);
    expect((await tripRow(world.ours.id))?.startDate).toBeNull();

    await setTripArchived(world.ours.id, true);
    expect((await tripRow(world.ours.id))?.archivedAt).not.toBeNull();
    await setTripArchived(world.ours.id, false);
    expect((await tripRow(world.ours.id))?.archivedAt).toBeNull();
  });

  it("stores tags and their tones together", async () => {
    await setTripTagRows(world.ours.id, ["beach"], { beach: "agreed" });
    const row = await tripRow(world.ours.id);
    expect(row?.tags).toEqual(["beach"]);
    expect(row?.tagTones).toEqual({ beach: "agreed" });
  });

  it("deletes softly, and the invite token stops resolving", async () => {
    await softDeleteTrip(world.ours.id);
    expect((await tripRow(world.ours.id))?.deletedAt).not.toBeNull();
    expect(await findTripByInviteToken("token-ours")).toBeUndefined();
  });
});

describe("the invite link", () => {
  it("resolves a live trip", async () => {
    expect((await findTripByInviteToken("token-ours"))?.id).toBe(world.ours.id);
  });

  it("revives a kicked member's row rather than colliding on the unique key", async () => {
    await removeMembership(world.ours.id, world.member);
    expect((await membership(world.ours.id, world.member))?.deletedAt).not.toBeNull();

    await joinByToken(world.ours.id, world.member);

    const row = await membership(world.ours.id, world.member);
    expect(row?.deletedAt).toBeNull();
    // Rejoining answers the travel-map question by making it moot (ticket 95).
    expect(row?.mapPromptAt).toBeNull();
  });
});

describe("the roster", () => {
  it("leaves a kicked member's map prompt for them to answer", async () => {
    await removeMembership(world.ours.id, world.member);
    const row = await membership(world.ours.id, world.member);
    expect(row?.mapPromptAt).not.toBeNull();
    expect(await hasPendingMapPrompt(world.ours.id, world.member)).toBe(true);

    await clearMapPrompt(world.ours.id, world.member);
    expect(await hasPendingMapPrompt(world.ours.id, world.member)).toBe(false);
  });

  it("will not promote a departed member's dead row", async () => {
    await removeMembership(world.ours.id, world.member);
    await setMemberRoleAdmin(world.ours.id, world.member);
    expect((await membership(world.ours.id, world.member))?.role).toBe("member");
  });
});

describe("leaving", () => {
  it("passes admin to the earliest-joined member when the last admin goes", async () => {
    await leaveTripAs({
      tripId: world.ours.id,
      userId: world.admin,
      isAdmin: true,
      archivedAt: null,
      others: [{ userId: world.member, role: "member", joinedAt: new Date(0) }],
    });

    expect((await membership(world.ours.id, world.admin))?.deletedAt).not.toBeNull();
    expect((await membership(world.ours.id, world.member))?.role).toBe("admin");
    // Succession, not archiving — somebody is still on the trip.
    expect((await tripRow(world.ours.id))?.archivedAt).toBeNull();
  });

  it("archives the trip when the last member goes, without deleting it", async () => {
    await leaveTripAs({
      tripId: world.theirs.id,
      userId: world.outsider,
      isAdmin: true,
      archivedAt: null,
      others: [],
    });

    const row = await tripRow(world.theirs.id);
    expect(row?.archivedAt).not.toBeNull();
    expect(row?.deletedAt).toBeNull();
  });

  it("does not re-stamp an already-archived trip — an archive never regresses", async () => {
    const original = new Date("2020-01-01");
    await db
      .update(schema.trip)
      .set({ archivedAt: original })
      .where(eq(schema.trip.id, world.theirs.id));

    await leaveTripAs({
      tripId: world.theirs.id,
      userId: world.outsider,
      isAdmin: true,
      archivedAt: original,
      others: [],
    });

    expect((await tripRow(world.theirs.id))?.archivedAt?.getTime()).toBe(
      original.getTime(),
    );
  });

  it("promotes nobody when another admin remains", async () => {
    await setMemberRoleAdmin(world.ours.id, world.member);
    await leaveTripAs({
      tripId: world.ours.id,
      userId: world.admin,
      isAdmin: true,
      archivedAt: null,
      others: [{ userId: world.member, role: "admin", joinedAt: new Date(0) }],
    });
    expect((await membership(world.ours.id, world.member))?.role).toBe("admin");
  });
});

describe("deleting an account", () => {
  it("hands each sole-admin trip over, then drops every membership", async () => {
    await handOverAndLeaveAllTrips(world.admin);

    expect((await membership(world.ours.id, world.admin))?.deletedAt).not.toBeNull();
    expect((await membership(world.ours.id, world.member))?.role).toBe("admin");
    // The trip itself is untouched — its rows stay, attributed to a placeholder.
    expect((await tripRow(world.ours.id))?.deletedAt).toBeNull();
    expect((await tripRow(world.ours.id))?.archivedAt).toBeNull();
  });
});

describe("availability", () => {
  it("upserts a batch, then flips it without deleting the rows", async () => {
    const dates = ["2026-09-01", "2026-09-02"];
    await setAvailability(world.ours.id, world.member, dates, true);

    const marks = () =>
      db
        .select()
        .from(schema.availability)
        .where(
          and(
            eq(schema.availability.tripId, world.ours.id),
            eq(schema.availability.userId, world.member),
          ),
        )
        .all();

    expect((await marks()).map((m) => m.available)).toEqual([true, true]);

    // Unmarking writes `false` rather than soft-deleting: the unique index
    // ignores `deleted_at`, so a dead row would bar that date for good.
    await setAvailability(world.ours.id, world.member, dates, false);
    expect(await marks()).toHaveLength(2);
    expect((await marks()).every((m) => m.available === false)).toBe(true);

    await setAvailability(world.ours.id, world.member, dates, true);
    await clearAvailabilityFor(world.ours.id, world.member);
    expect((await marks()).every((m) => m.available === false)).toBe(true);
  });

  it("is a no-op on an empty batch", async () => {
    await setAvailability(world.ours.id, world.member, [], true);
    expect(await db.select().from(schema.availability).all()).toHaveLength(0);
  });
});

/**
 * Named invites (ticket 146). The properties here are the ones that would
 * break quietly: an invite must not be a membership, re-inviting must land on
 * the row a decline left behind, and an invite to a trip nobody can open must
 * not go on asking for an answer.
 */
describe("named invites", () => {
  const invitesFor = (tripId: number) =>
    db
      .select()
      .from(schema.tripInvite)
      .where(eq(schema.tripInvite.tripId, tripId))
      .all();

  it("opens one pending invite per friend and grants nothing", async () => {
    const n = await inviteToTrip({
      tripId: world.ours.id,
      fromUserId: world.admin,
      toUserIds: [world.outsider],
    });

    expect(n).toBe(1);
    expect((await invitesFor(world.ours.id)).map((i) => i.status)).toEqual([
      "pending",
    ]);
    // The whole point: being invited is not being in.
    expect(await membership(world.ours.id, world.outsider)).toBeUndefined();
    expect(await countMembers(world.ours.id)).toBe(2);
  });

  it("skips people already on the roster, and yourself", async () => {
    const n = await inviteToTrip({
      tripId: world.ours.id,
      fromUserId: world.admin,
      toUserIds: [world.admin, world.member, world.outsider, world.outsider],
    });

    expect(n).toBe(1);
    expect(await invitesFor(world.ours.id)).toHaveLength(1);
  });

  it("re-invites onto the declined row rather than a second one", async () => {
    await inviteToTrip({
      tripId: world.ours.id,
      fromUserId: world.admin,
      toUserIds: [world.outsider],
    });
    await settleInvite(world.ours.id, world.outsider, "declined");
    expect(await listPendingInvitesFor(world.outsider)).toEqual([]);

    // A different member asking this time — the invite says who asked *now*.
    await inviteToTrip({
      tripId: world.ours.id,
      fromUserId: world.member,
      toUserIds: [world.outsider],
    });

    const rows = await invitesFor(world.ours.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("pending");
    expect(rows[0].fromUserId).toBe(world.member);
  });

  it("names the trip and whoever asked, and counts what's waiting", async () => {
    await inviteToTrip({
      tripId: world.ours.id,
      fromUserId: world.admin,
      toUserIds: [world.outsider],
    });

    const [invite] = await listPendingInvitesFor(world.outsider);
    expect(invite.tripName).toBe("Ours");
    expect(invite.fromName).toBe("Ada");
    expect(await countPendingInvitesFor(world.outsider)).toBe(1);

    expect((await listPendingInvitees(world.ours.id)).map((p) => p.name)).toEqual([
      "Ozz",
    ]);
  });

  it("stops asking once the trip is archived or deleted", async () => {
    await inviteToTrip({
      tripId: world.ours.id,
      fromUserId: world.admin,
      toUserIds: [world.outsider],
    });

    await setTripArchived(world.ours.id, true);
    expect(await listPendingInvitesFor(world.outsider)).toEqual([]);
    expect(await countPendingInvitesFor(world.outsider)).toBe(0);

    await setTripArchived(world.ours.id, false);
    expect(await countPendingInvitesFor(world.outsider)).toBe(1);

    await softDeleteTrip(world.ours.id);
    expect(await countPendingInvitesFor(world.outsider)).toBe(0);
  });

  it("closes the invite when it's answered, either way", async () => {
    await inviteToTrip({
      tripId: world.ours.id,
      fromUserId: world.admin,
      toUserIds: [world.outsider],
    });

    expect(await findPendingInvite(world.ours.id, world.outsider)).toBeDefined();

    await joinByToken(world.ours.id, world.outsider);
    await settleInvite(world.ours.id, world.outsider, "accepted");

    expect(await findPendingInvite(world.ours.id, world.outsider)).toBeUndefined();
    expect(await listPendingInvitees(world.ours.id)).toEqual([]);
    expect(await membership(world.ours.id, world.outsider)).toBeDefined();
  });

  it("is a no-op with nobody to invite", async () => {
    expect(
      await inviteToTrip({
        tripId: world.ours.id,
        fromUserId: world.admin,
        toUserIds: [],
      }),
    ).toBe(0);
    expect(await invitesFor(world.ours.id)).toHaveLength(0);
  });
});
