/**
 * Named groups (#545). The rules worth failing on: only friends and people on a live trip with
 * you can be put in a group, the two limits hold on the server, a member who can no longer be
 * invited drops out at read time (rule 4) without losing their row, and nobody else can see or
 * touch a group.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { befriend, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  createGroup,
  deleteGroup,
  invitableIdsOf,
  listGroupsFor,
  listPastTripsFor,
  saveGroup,
  setGroupMember,
} from "@/server/social/groups";
import { removeMembership } from "@/server/trips/roster";
import { softDeleteTrip } from "@/server/trips/trips";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await befriend(world.admin, world.outsider);
});

const addUsers = async (ids: string[], anonymous = false) => {
  await db
    .insert(schema.user)
    .values(ids.map((id) => ({ id, name: id, email: `${id}@example.test`, isAnonymous: anonymous })));
  return ids;
};

const namesIn = async (ownerId: string) =>
  (await listGroupsFor(ownerId)).map((g) => ({ name: g.name, ids: g.members.map((m) => m.id).sort() }));

describe("who can be put in a group", () => {
  it("is your friends and the people on a live trip with you, never yourself", async () => {
    const ids = await invitableIdsOf(world.admin);
    expect([...ids].sort()).toEqual([world.member, world.outsider].sort());
  });

  it("drops a co-member once the trip is deleted", async () => {
    await softDeleteTrip(world.ours.id);
    expect(await invitableIdsOf(world.admin)).not.toContain(world.member);
  });

  it("drops a co-member who left the trip", async () => {
    await removeMembership(world.ours.id, world.member, world.admin);
    expect(await invitableIdsOf(world.admin)).not.toContain(world.member);
  });

  it("never offers a guest (ADR-029)", async () => {
    const [guest] = await addUsers(["u-guest"], true);
    await db.insert(schema.tripMembership).values({ tripId: world.ours.id, userId: guest });
    expect(await invitableIdsOf(world.admin)).not.toContain(guest);
  });
});

describe("making a group", () => {
  it("keeps its name and people, for its maker only", async () => {
    await createGroup(world.admin, { name: "  Krakow lot ", memberIds: [world.member, world.outsider] });

    expect(await namesIn(world.admin)).toEqual([
      { name: "Krakow lot", ids: [world.member, world.outsider].sort() },
    ]);
    expect(await listGroupsFor(world.member)).toEqual([]);
  });

  it("needs a name and somebody in it", async () => {
    await expect(createGroup(world.admin, { name: " ", memberIds: [world.member] })).rejects.toThrow("Give the group a name.");
    await expect(createGroup(world.admin, { name: "Empty", memberIds: [] })).rejects.toThrow("Pick at least one person.");
  });

  it("refuses a stranger, and does not write the group", async () => {
    const [stranger] = await addUsers(["u-stranger"]);
    await expect(
      createGroup(world.admin, { name: "Sneaky", memberIds: [world.member, stranger] }),
    ).rejects.toThrow("You can only add friends and people on a trip with you.");
    expect(await listGroupsFor(world.admin)).toEqual([]);
  });

  it("holds 20 people at most", async () => {
    const many = await addUsers(Array.from({ length: 21 }, (_, i) => `u-pal-${i}`));
    for (const id of many) await befriend(world.admin, id);

    await expect(createGroup(world.admin, { name: "Big", memberIds: many })).rejects.toThrow(
      "A group holds 20 people at most.",
    );
    await createGroup(world.admin, { name: "Twenty", memberIds: many.slice(0, 20) });
  });

  it("keeps 20 groups a person at most", async () => {
    for (let i = 0; i < 20; i++) await createGroup(world.admin, { name: `G${i}`, memberIds: [world.member] });
    await expect(createGroup(world.admin, { name: "One more", memberIds: [world.member] })).rejects.toThrow(
      "You can keep 20 groups at most. Delete one first.",
    );
  });
});

describe("changing a group", () => {
  let groupId: number;
  beforeEach(async () => {
    groupId = await createGroup(world.admin, { name: "Ours", memberIds: [world.member] });
  });

  it("renames it and sets who is in it, reviving a row rather than adding one", async () => {
    await saveGroup(world.admin, groupId, { name: "Renamed", memberIds: [world.outsider] });
    await saveGroup(world.admin, groupId, { name: "Renamed", memberIds: [world.outsider, world.member] });

    expect(await namesIn(world.admin)).toEqual([
      { name: "Renamed", ids: [world.member, world.outsider].sort() },
    ]);
    const rows = await db
      .select()
      .from(schema.friendGroupMember)
      .where(and(eq(schema.friendGroupMember.groupId, groupId), eq(schema.friendGroupMember.userId, world.member)))
      .all();
    expect(rows).toHaveLength(1);
  });

  it("adds and removes one person", async () => {
    await setGroupMember(world.admin, groupId, world.outsider, true);
    expect((await namesIn(world.admin))[0].ids).toEqual([world.member, world.outsider].sort());

    await setGroupMember(world.admin, groupId, world.member, false);
    expect((await namesIn(world.admin))[0].ids).toEqual([world.outsider]);
  });

  it("deletes softly (rule 8)", async () => {
    await deleteGroup(world.admin, groupId);
    expect(await listGroupsFor(world.admin)).toEqual([]);
    const row = await db.select().from(schema.friendGroup).where(eq(schema.friendGroup.id, groupId)).get();
    expect(row?.deletedAt).not.toBeNull();
  });

  it("is nobody else's to change", async () => {
    await expect(saveGroup(world.outsider, groupId, { name: "Mine", memberIds: [world.admin] })).rejects.toThrow(
      "That group is gone.",
    );
    await expect(setGroupMember(world.outsider, groupId, world.admin, true)).rejects.toThrow("That group is gone.");
    await expect(deleteGroup(world.outsider, groupId)).rejects.toThrow("That group is gone.");
    expect(await namesIn(world.admin)).toEqual([{ name: "Ours", ids: [world.member] }]);
  });

  it("hides a member who can no longer be invited, and keeps their row (rule 4)", async () => {
    await removeMembership(world.ours.id, world.member, world.admin);
    expect((await listGroupsFor(world.admin))[0].members).toEqual([]);

    await befriend(world.admin, world.member);
    expect((await namesIn(world.admin))[0].ids).toEqual([world.member]);
  });
});

describe("a past trip's people", () => {
  it("lists trips that have ended, newest first, with the people you can invite", async () => {
    await db.update(schema.trip).set({ startDate: "2026-02-01", endDate: "2026-02-05" }).where(eq(schema.trip.id, world.ours.id));
    const later = await db
      .insert(schema.trip)
      .values({ name: "Later", createdBy: world.admin, inviteToken: "t-later", startDate: "2026-05-01", endDate: "2026-05-03" })
      .returning({ id: schema.trip.id })
      .get();
    const [guest] = await addUsers(["u-guest"], true);
    await db.insert(schema.tripMembership).values([
      { tripId: later.id, userId: world.admin },
      { tripId: later.id, userId: world.outsider },
      { tripId: later.id, userId: guest },
    ]);

    const trips = await listPastTripsFor(world.admin, "2026-11-10");
    expect(trips.map((t) => [t.name, t.people.map((p) => p.id)])).toEqual([
      ["Later", [world.outsider]],
      ["Ours", [world.member]],
    ]);
  });

  it("skips a trip that has not ended", async () => {
    await db.update(schema.trip).set({ startDate: "2026-12-01", endDate: "2026-12-05" }).where(eq(schema.trip.id, world.ours.id));
    expect(await listPastTripsFor(world.admin, "2026-11-10")).toEqual([]);
  });
});
