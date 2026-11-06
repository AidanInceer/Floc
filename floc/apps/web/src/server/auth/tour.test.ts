import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { markTourSeen, tourSeenAt, walkthroughDue } from "@/server/auth/tour";
import { softDeleteTrip } from "@/server/trips/trips";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("the tour, once per person (#314)", () => {
  it("is unset for a new person", async () => {
    expect(await tourSeenAt(world.member)).toBeNull();
  });

  it("is set once marked, for that person only", async () => {
    await markTourSeen(world.member);
    expect(await tourSeenAt(world.member)).toBeInstanceOf(Date);
    expect(await tourSeenAt(world.admin)).toBeNull();
  });

  it("keeps the first time when marked twice", async () => {
    const first = new Date("2026-01-01T00:00:00Z");
    await markTourSeen(world.member);
    await db
      .update(schema.userProfile)
      .set({ tourSeenAt: first })
      .where(eq(schema.userProfile.userId, world.member));

    await markTourSeen(world.member);
    expect(await tourSeenAt(world.member)).toEqual(first);
  });

  it("stays set when a trip is deleted", async () => {
    await markTourSeen(world.admin);
    await softDeleteTrip(world.ours.id);
    expect(await tourSeenAt(world.admin)).toBeInstanceOf(Date);
  });
});

describe("the walkthrough, first trip only", () => {
  const joinTheirs = () =>
    db.insert(schema.tripMembership).values({ tripId: world.theirs.id, userId: world.member, role: "member" });

  it("is due on a person's first trip", async () => {
    expect(await walkthroughDue(world.member)).toBe(true);
  });

  it("is not due once seen", async () => {
    await markTourSeen(world.member);
    expect(await walkthroughDue(world.member)).toBe(false);
  });

  it("is not due for someone already on another trip", async () => {
    await joinTheirs();
    expect(await walkthroughDue(world.member)).toBe(false);
  });

  it("counts an archived trip as one they were on", async () => {
    await joinTheirs();
    await db.update(schema.trip).set({ archivedAt: new Date() }).where(eq(schema.trip.id, world.theirs.id));
    expect(await walkthroughDue(world.member)).toBe(false);
  });

  it("does not count a deleted trip", async () => {
    await joinTheirs();
    await softDeleteTrip(world.theirs.id);
    expect(await walkthroughDue(world.member)).toBe(true);
  });
});
