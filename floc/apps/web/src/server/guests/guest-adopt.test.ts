/**
 * A guest signs up or signs in (#442, ADR-029): their answers become the
 * account's, once, and the account joins the trip. The account's own answer
 * wins over the guest's, and a full trip drops the guest's answers.
 */
import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { setAvailability } from "@/server/itinerary/availability";
import { insertIdea, toggleIdeaVote } from "@/server/ideas/ideas";
import { isLiveMember } from "@/server/trips/roster";
import { adoptGuest } from "@/server/guests/guest-adopt";
import { LIMITS } from "@/server/limits";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function makeUser(id: string, isAnonymous: boolean) {
  await db.insert(schema.user).values({ id, name: id, email: `${id}@x.test`, isAnonymous });
  return id;
}

const votesOf = (userId: string) =>
  db
    .select()
    .from(schema.ideaVote)
    .where(and(eq(schema.ideaVote.userId, userId), isNull(schema.ideaVote.deletedAt)))
    .all();

const marksOf = (userId: string) =>
  db.select().from(schema.availability).where(eq(schema.availability.userId, userId)).all();

describe("adoptGuest", () => {
  it("moves a guest's votes and marks to the new account and joins the trip", async () => {
    const guest = await makeUser("g-sam", true);
    const sam = await makeUser("u-sam", false);
    const ideaId = await insertIdea({ tripId: world.ours.id, createdBy: world.admin, title: "Lisbon" });
    await toggleIdeaVote(ideaId, guest);
    await setAvailability(world.ours.id, guest, ["2026-09-01", "2026-09-02"], true);

    await adoptGuest(guest, sam);

    expect((await votesOf(sam)).map((v) => v.ideaId)).toEqual([ideaId]);
    expect((await marksOf(sam)).map((m) => m.date).sort()).toEqual(["2026-09-01", "2026-09-02"]);
    expect(await votesOf(guest)).toEqual([]);
    expect(await marksOf(guest)).toEqual([]);
    expect(await isLiveMember(world.ours.id, sam)).toBe(true);
  });

  it("keeps the account's own answer where both answered, with no duplicate", async () => {
    const guest = await makeUser("g-sam", true);
    const ideaId = await insertIdea({ tripId: world.ours.id, createdBy: world.admin, title: "Lisbon" });
    await toggleIdeaVote(ideaId, guest);
    await toggleIdeaVote(ideaId, world.member);
    await setAvailability(world.ours.id, guest, ["2026-09-01"], true);
    await setAvailability(world.ours.id, world.member, ["2026-09-01"], false);

    await adoptGuest(guest, world.member);

    expect(await votesOf(world.member)).toHaveLength(1);
    const marks = await marksOf(world.member);
    expect(marks).toHaveLength(1);
    expect(marks[0].available).toBe(false);
  });

  it("takes the guest's vote where the account had taken its own back", async () => {
    const guest = await makeUser("g-sam", true);
    const ideaId = await insertIdea({ tripId: world.ours.id, createdBy: world.admin, title: "Lisbon" });
    await toggleIdeaVote(ideaId, world.member);
    await toggleIdeaVote(ideaId, world.member);
    await toggleIdeaVote(ideaId, guest);

    await adoptGuest(guest, world.member);

    expect(await votesOf(world.member)).toHaveLength(1);
  });

  it("drops the guest's answers on a trip that is full", async () => {
    const guest = await makeUser("g-sam", true);
    const sam = await makeUser("u-sam", false);
    await setAvailability(world.ours.id, guest, ["2026-09-01"], true);
    for (let i = 2; i < LIMITS.members; i++) {
      const id = await makeUser(`u-fill-${i}`, false);
      await db.insert(schema.tripMembership).values({ tripId: world.ours.id, userId: id });
    }

    await adoptGuest(guest, sam);

    expect(await isLiveMember(world.ours.id, sam)).toBe(false);
    expect(await marksOf(sam)).toEqual([]);
    expect(await marksOf(guest)).toEqual([]);
  });

  it("does nothing when the person signing in was not a guest", async () => {
    await setAvailability(world.ours.id, world.member, ["2026-09-01"], true);
    await adoptGuest(world.member, world.outsider);
    expect(await marksOf(world.member)).toHaveLength(1);
  });
});
