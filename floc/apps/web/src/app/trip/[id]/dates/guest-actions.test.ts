/** #442: any member may remove a guest from the trip (not an admin power, rule 6); an outsider may not. */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { setAvailability } from "@/server/itinerary/availability";
import { removeTripGuest } from "./actions";

let world: Scenario;
const GUEST = "g-sam";

const guestMarks = () => db.select().from(schema.availability).where(eq(schema.availability.userId, GUEST)).all();

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.insert(schema.user).values({ id: GUEST, name: "Sam", email: "g@guest.test", isAnonymous: true });
  await setAvailability(world.ours.id, GUEST, ["2026-09-01"], true);
});

describe("removeTripGuest", () => {
  it("lets a plain member remove a guest", async () => {
    signIn(world.member);
    await removeTripGuest(world.ours.id, GUEST);
    expect(await guestMarks()).toEqual([]);
  });

  it("answers an outsider as a trip that does not exist", async () => {
    signIn(world.outsider);
    await expectNotFound(() => removeTripGuest(world.ours.id, GUEST));
    expect(await guestMarks()).toHaveLength(1);
  });

  it("cannot remove a member this way", async () => {
    await setAvailability(world.ours.id, world.admin, ["2026-09-01"], true);
    signIn(world.member);
    await removeTripGuest(world.ours.id, world.admin);
    const adminMarks = await db.select().from(schema.availability).where(eq(schema.availability.userId, world.admin)).all();
    expect(adminMarks).toHaveLength(1);
  });
});
