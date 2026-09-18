/**
 * The trip row's own rules (ticket 242, split out of membership.test.ts) —
 * tested against the module directly, since the patch semantics and the
 * archive/delete distinction are its properties, not a caller's.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { findTripByInviteToken } from "@/server/trips/invites";
import {
  createTripWithAdmin,
  setTripArchived,
  softDeleteTrip,
  updateTrip,
} from "@/server/trips/trips";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const tripRow = (id: number) =>
  db.select().from(schema.trip).where(eq(schema.trip.id, id)).get();

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
    expect(row?.inviteToken).toMatch( // random UUID, never derived from the trip id (ticket 05)
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

describe("updating the trip row", () => {
  it("renames, re-dates, and clears back to undated", async () => {
    await updateTrip(world.ours.id, { name: "Portugal, late summer" });
    expect((await tripRow(world.ours.id))?.name).toBe("Portugal, late summer");

    await updateTrip(world.ours.id, {
      startDate: "2026-09-01",
      endDate: "2026-09-08",
    });
    expect((await tripRow(world.ours.id))?.endDate).toBe("2026-09-08");

    await updateTrip(world.ours.id, { startDate: null, endDate: null });
    expect((await tripRow(world.ours.id))?.startDate).toBeNull();
  });

  it("stores tags, and a chosen colour, on the trip", async () => {
    await updateTrip(world.ours.id, { tags: ["beach"], colorKey: "mint" });
    const row = await tripRow(world.ours.id);
    expect(row?.tags).toEqual(["beach"]);
    expect(row?.colorKey).toBe("mint");

    // Null clears it back to the id-rotation default; a field left out is left alone.
    await updateTrip(world.ours.id, { colorKey: null });
    const after = await tripRow(world.ours.id);
    expect(after?.colorKey).toBeNull();
    expect(after?.tags).toEqual(["beach"]);
  });

  it("stores a chosen mark, and clears it back to the pastel alone (#318)", async () => {
    await updateTrip(world.ours.id, { mark: "wave" });
    expect((await tripRow(world.ours.id))?.mark).toBe("wave");

    await updateTrip(world.ours.id, { mark: null });
    expect((await tripRow(world.ours.id))?.mark).toBeNull();
  });

  it("leaves a deleted trip alone — the patch is not a way back in", async () => {
    await softDeleteTrip(world.ours.id);
    await updateTrip(world.ours.id, { name: "Resurrected" });
    expect((await tripRow(world.ours.id))?.name).not.toBe("Resurrected");
  });
});

describe("archiving and deleting", () => {
  it("archives and un-archives", async () => {
    await setTripArchived(world.ours.id, true);
    expect((await tripRow(world.ours.id))?.archivedAt).not.toBeNull();
    await setTripArchived(world.ours.id, false);
    expect((await tripRow(world.ours.id))?.archivedAt).toBeNull();
  });

  it("deletes softly, and the invite token stops resolving", async () => {
    await softDeleteTrip(world.ours.id);
    expect((await tripRow(world.ours.id))?.deletedAt).not.toBeNull();
    expect(await findTripByInviteToken("token-ours")).toBeUndefined();
  });
});
