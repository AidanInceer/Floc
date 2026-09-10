/**
 * The roster's rules (ticket 242, split out of membership.test.ts) — succession,
 * the soft-delete filter, and the map prompt a departure leaves behind. Tested
 * against the module directly: they should fail if moved back into a caller.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  addMember,
  clearMapPrompt,
  countMembers,
  handOverAndLeaveAllTrips,
  hasPendingMapPrompt,
  isLiveMember,
  leaveTripAs,
  removeMembership,
  setMemberRoleAdmin,
} from "@/server/trips/roster";

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

describe("the roster", () => {
  it("counts and recognises live members only", async () => {
    expect(await countMembers(world.ours.id)).toBe(2);
    expect(await isLiveMember(world.ours.id, world.member)).toBe(true);

    await removeMembership(world.ours.id, world.member);

    expect(await countMembers(world.ours.id)).toBe(1);
    expect(await isLiveMember(world.ours.id, world.member)).toBe(false);
  });

  it("revives a kicked member's row rather than colliding on the unique key", async () => {
    await removeMembership(world.ours.id, world.member);
    expect((await membership(world.ours.id, world.member))?.deletedAt).not.toBeNull();

    await addMember(world.ours.id, world.member);

    const row = await membership(world.ours.id, world.member);
    expect(row?.deletedAt).toBeNull();
    expect(row?.mapPromptAt).toBeNull(); // rejoining makes the travel-map question moot (ticket 95)
  });

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
    expect((await tripRow(world.ours.id))?.archivedAt).toBeNull(); // succession, not archiving
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
    expect((await tripRow(world.ours.id))?.deletedAt).toBeNull(); // trip untouched, rows stay attributed to a placeholder
    expect((await tripRow(world.ours.id))?.archivedAt).toBeNull();
  });
});
