/**
 * Guests on an invite link (#442, ADR-029). The rules worth failing on: a guest
 * counts only on the trip they voted on, the 13th is refused, a member's row is
 * never taken for a guest's, and removing one leaves nothing behind.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { GUEST_CAP } from "@floc/core/people/guests";
import { setAvailability } from "@/server/itinerary/availability";
import { insertIdea, toggleIdeaVote } from "@/server/ideas/ideas";
import {
  assertGuestRoom,
  findGuest,
  listGuests,
  removeGuest,
} from "@/server/guests/guests";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function makeGuest(id: string, name = "Sam") {
  await db.insert(schema.user).values({ id, name, email: `${id}@guest.test`, isAnonymous: true });
  return id;
}

async function ideaOn(tripId: number) {
  return insertIdea({ tripId, createdBy: world.admin, title: "Lisbon" });
}

describe("findGuest", () => {
  it("answers for a guest and never for a real person", async () => {
    const sam = await makeGuest("g-sam");
    expect(await findGuest(sam)).toEqual({ id: sam, name: "Sam" });
    expect(await findGuest(world.member)).toBeNull();
  });
});

describe("listGuests", () => {
  it("lists a guest who marked a date or voted, on that trip only", async () => {
    const sam = await makeGuest("g-sam", "Sam");
    const kit = await makeGuest("g-kit", "Kit");
    await setAvailability(world.ours.id, sam, ["2026-09-01"], true);
    await toggleIdeaVote(await ideaOn(world.ours.id), kit);

    const names = (await listGuests(world.ours.id)).map((g) => g.name).sort();
    expect(names).toEqual(["Kit", "Sam"]);
    expect(await listGuests(world.theirs.id)).toEqual([]);
  });

  it("never lists a member, whose marks are theirs not a guest's", async () => {
    await setAvailability(world.ours.id, world.member, ["2026-09-01"], true);
    expect(await listGuests(world.ours.id)).toEqual([]);
  });
});

describe("assertGuestRoom", () => {
  it("refuses a new guest once the trip has its cap", async () => {
    for (let i = 0; i < GUEST_CAP; i++) {
      const g = await makeGuest(`g-${i}`);
      await setAvailability(world.ours.id, g, ["2026-09-01"], true);
    }
    const late = await makeGuest("g-late");
    await expect(assertGuestRoom(world.ours.id, late)).rejects.toThrow(/full/);
  });

  it("still lets a guest already on the trip change their answer", async () => {
    let first = "";
    for (let i = 0; i < GUEST_CAP; i++) {
      const g = await makeGuest(`g-${i}`);
      first ||= g;
      await setAvailability(world.ours.id, g, ["2026-09-01"], true);
    }
    await expect(assertGuestRoom(world.ours.id, first)).resolves.toBeUndefined();
  });
});

describe("removeGuest", () => {
  it("deletes the guest's votes and marks on this trip for good", async () => {
    const sam = await makeGuest("g-sam");
    const ideaId = await ideaOn(world.ours.id);
    await toggleIdeaVote(ideaId, sam);
    await setAvailability(world.ours.id, sam, ["2026-09-01"], true);

    expect(await removeGuest(world.ours.id, sam)).toBe(true);

    expect(await db.select().from(schema.ideaVote).where(eq(schema.ideaVote.userId, sam)).all()).toEqual([]);
    expect(await db.select().from(schema.availability).where(eq(schema.availability.userId, sam)).all()).toEqual([]);
  });

  it("leaves the guest's answers on another trip", async () => {
    const sam = await makeGuest("g-sam");
    await setAvailability(world.ours.id, sam, ["2026-09-01"], true);
    await setAvailability(world.theirs.id, sam, ["2026-09-01"], true);

    await removeGuest(world.ours.id, sam);

    const left = await db.select().from(schema.availability).where(eq(schema.availability.userId, sam)).all();
    expect(left.map((r) => r.tripId)).toEqual([world.theirs.id]);
  });

  it("refuses to touch a real person", async () => {
    await setAvailability(world.ours.id, world.member, ["2026-09-01"], true);
    expect(await removeGuest(world.ours.id, world.member)).toBe(false);
    const kept = await db
      .select()
      .from(schema.availability)
      .where(and(eq(schema.availability.userId, world.member), eq(schema.availability.tripId, world.ours.id)))
      .all();
    expect(kept).toHaveLength(1);
  });
});
