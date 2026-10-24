/**
 * A guest who has not made an account a week after their first answer is deleted
 * for good with their answers (#442, ADR-029), however often they came back.
 * A real person is never touched.
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { setAvailability } from "@/server/itinerary/availability";
import { insertIdea, toggleIdeaVote } from "@/server/ideas/ideas";
import { purgeOldGuests } from "@/server/guests/guest-purge";

let world: Scenario;
const NOW = new Date("2026-10-24T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function makeGuest(id: string, created: Date, lastSeen = created) {
  await db.insert(schema.user).values({ id, name: id, email: `${id}@guest.test`, isAnonymous: true, createdAt: created, updatedAt: lastSeen });
  await db.insert(schema.session).values({ id: `s-${id}`, token: `t-${id}`, userId: id, expiresAt: NOW, createdAt: created, updatedAt: lastSeen });
  return id;
}

const userRow = (id: string) => db.select().from(schema.user).where(eq(schema.user.id, id)).get();

describe("purgeOldGuests", () => {
  it("deletes a guest made over a week ago, with their votes and marks", async () => {
    const old = await makeGuest("g-old", daysAgo(8));
    const ideaId = await insertIdea({ tripId: world.ours.id, createdBy: world.admin, title: "Lisbon" });
    await toggleIdeaVote(ideaId, old);
    await setAvailability(world.ours.id, old, ["2026-09-01"], true);

    expect(await purgeOldGuests(NOW)).toBe(1);

    expect(await userRow(old)).toBeUndefined();
    expect(await db.select().from(schema.ideaVote).where(eq(schema.ideaVote.userId, old)).all()).toEqual([]);
    expect(await db.select().from(schema.availability).where(eq(schema.availability.userId, old)).all()).toEqual([]);
  });

  it("deletes a guest made over a week ago even if they came back today", async () => {
    const back = await makeGuest("g-back", daysAgo(8), NOW);
    expect(await purgeOldGuests(NOW)).toBe(1);
    expect(await userRow(back)).toBeUndefined();
  });

  it("keeps a guest made within the week", async () => {
    const recent = await makeGuest("g-recent", daysAgo(6));
    expect(await purgeOldGuests(NOW)).toBe(0);
    expect(await userRow(recent)).toBeDefined();
  });

  it("never deletes a real person, however old the account", async () => {
    await db.update(schema.user).set({ createdAt: daysAgo(400), updatedAt: daysAgo(400) }).where(eq(schema.user.id, world.member));
    await purgeOldGuests(NOW);
    expect(await userRow(world.member)).toBeDefined();
  });
});
